import { Injectable, BadRequestException } from '@nestjs/common';
import path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ImageService {
  async handleAvatarUpload(file: {
    filename: string;
    mimetype: string;
    path: string;
    size: number;
  }) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and GIF are allowed.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds the maximum allowed size of 5MB.');
    }

    return { avatarUrl: `/uploads/avatars/${file.filename}` };
  }
  
  async deleteFileFromStorage(fileUrl: string) {
    const fileName = path.basename(fileUrl);
    const filePath = path.join('./uploads/avatars', fileName);
  
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Could not delete file ${fileName}:`, error.message);
    }
  }
}
