import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  Req,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileUploadService } from '../services/file.upload.service';
import { UploadInitDto } from '../dto/upload/upload.init.dto';
import { UploadInitMultipartDto } from '../dto/upload/upload.init.multipart.dto';
import { UploadCompleteDto } from '../dto/upload/upload.complete.dto';
import { UserIpInterceptor } from 'src/common/interceptors/user.ip.interceptor';
import { UploadToS3Dto } from '../dto/upload/upload.s3.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('/upload')
export class FileUploadController {
  constructor(private readonly filesUploadService: FileUploadService) {}

  @Post('auth')
  @UseGuards(AuthGuard)
  @UseInterceptors(UserIpInterceptor)
  async uploadFileAuthenticated(@Body() s3UploadData: UploadToS3Dto, @Req() req: Request) {
    if (s3UploadData.uploadToken) {
      throw new BadRequestException('Use the public route for token-based upload.');
    }

    const uploadData = {
      ...s3UploadData,
      uploaderIp: req.userIp,
    };

    const result = await this.filesUploadService.uploadFileToS3AndSaveMetadata(uploadData);
    return { success: true, url: result.url, uploadId: result.uploadId };
  }

  @Post('public')
  @UseInterceptors(UserIpInterceptor)
  async uploadFilePublic(@Body() s3UploadData: UploadToS3Dto, @Req() req: Request) {
    if (!s3UploadData.uploadToken) {
      throw new UnauthorizedException('uploadToken is required for public access.');
    }
    const uploadData = {
      ...s3UploadData,
      uploaderIp: req.userIp,
    };

    // const result = await this.filesUploadService.uploadFileByToken(uploadData);
    // return { success: true, url: result.url, uploadId: result.uploadId };
  }

  @Post('init')
  async uploadInit(@Body() body: UploadInitDto) {
    const strategy = await this.filesUploadService.initUploading(body.fileSize);
    return { success: true, strategy };
  }

  @Post('multipart/init')
  async uploadMultipartInit(@Body() body: UploadInitMultipartDto, @Req() req: Request) {
    const initRes = await this.filesUploadService.initUploadMultipart(body, req.ip ?? 'none');
    return { success: true, data: initRes };
  }

  @Post('multipart/complete')
  async uploadComplete(@Body() body: UploadCompleteDto, @Req() req: Request) {
    const ip = req.ip;
    await this.filesUploadService.completeMultipart(body);

    return { success: true, message: 'Multipart upload completed' };
  }
}
