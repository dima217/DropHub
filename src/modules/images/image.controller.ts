import {
  BadRequestException,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from 'src/auth/guards/roles-guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { Roles } from 'src/auth/common/decorators/role.decorator';
import { ImageService } from './image.service';

@Controller('image')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('upload')
  @Roles('admin', 'user')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.imageService.handleAvatarUpload(file);
    return { success: true, avatarUrl: result.avatarUrl };
  }
}
