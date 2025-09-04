import {
  BadRequestException,
  Controller,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/roles-guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { FastifyRequest } from 'fastify';
import { ImageService } from './image.service';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import * as fs from 'fs/promises';

@Controller('/image')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('upload')
  @Roles('admin', 'user')
  async uploadAvatar(@Req() req: FastifyRequest) {
    const mp = await req.file(); 

    if (!mp) {
      throw new BadRequestException('No file uploaded');
    }

    const filename = `${uuidv4()}${extname(mp.filename)}`;
    const filePath = `./uploads/avatars/${filename}`;

    await fs.mkdir('./uploads/avatars', { recursive: true });
    await fs.writeFile(filePath, await mp.toBuffer());

    return this.imageService.handleAvatarUpload({
      filename,
      mimetype: mp.mimetype,
      path: filePath,
      size: mp.file.bytesRead,
    });    
  }
}
