import { Injectable, BadRequestException } from '@nestjs/common';
import path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Injectable()
export class ImageService {
  private readonly UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'avatars');
  private readonly MAX_SIZE = 5 * 1024 * 1024;
  private readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

  async handleAvatarUpload(file: Express.Multer.File) {
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      await fs.unlink(file.path).catch(() => {});
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and GIF are allowed.');
    }

    if (file.size > this.MAX_SIZE) {
      await fs.unlink(file.path).catch(() => {});
      throw new BadRequestException('File size exceeds the maximum allowed size of 5MB.');
    }

    const originalExtension = extname(file.originalname);
    const filename = `${uuidv4()}${originalExtension}`;
    const newFilePath = path.join(this.UPLOADS_DIR, filename);

    await fs.mkdir(this.UPLOADS_DIR, { recursive: true });
    await fs.rename(file.path, newFilePath);

    return { avatarUrl: `/uploads/avatars/${filename}` };
  }

  async deleteFileFromStorage(fileUrl: string) {
    const fileName = path.basename(fileUrl);
    const filePath = path.join(this.UPLOADS_DIR, fileName);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Could not delete file ${fileName}:`, error.message);
    }
  }
}
