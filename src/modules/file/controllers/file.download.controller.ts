import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { DownloadService } from '../services/download/download.service';
import { DownloadFileByTokenDto } from '../dto/download/download.file.token.dto';
import { FilesService } from '../services/file.service';
import { AuthGuard } from '@nestjs/passport';
import type { RequestWithUser } from 'src/types/express';
import { DownloadFileMultipartDto } from '../dto/download/download.file.multipart';
import { DownloadFileDto } from '../dto/download/download.file.dto';

@Controller('/download')
export class FileDownloadController {
  constructor(
    private readonly fileService: FilesService,
    private readonly fileDownloadService: DownloadService,
  ) {}

  @Post('/stream')
  async downloadFile(@Body() body: DownloadFileMultipartDto, @Res() res: Response) {
    const fileDoc = await this.fileService.getFileByUploadId(body.uploadId);

    const mimeType = fileDoc?.mimeType || 'application/octet-stream'; // fallback

    const stream = await this.fileDownloadService.getStream(fileDoc.key);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.storedName}"`);

    stream.pipe(res);
  }

  @Post('url-public')
  async downloadFileByURL(@Body() body: DownloadFileByTokenDto) {
    const url = this.fileDownloadService.downloadFileByToken(body);
    return { url };
  }

  @UseGuards(AuthGuard)
  @Post('/url-private')
  async downloadFileByURLPrivate(@Body() body: DownloadFileDto, @Req() req: RequestWithUser) {
    const downloadData = {
      fileId: body.fileId,
      userId: req.user.id,
    };
    const url = this.fileDownloadService.getDownloadLinkAuthenticated(downloadData);
    return { url };
  }
}
