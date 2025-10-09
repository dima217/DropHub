import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { FileDownloadService } from '../services/download/download.service';
import { DownloadFileDto } from '../dto/download/download.file.dto';
import { FilesService } from '../services/file.service';

@Controller('/download')
export class FileDownloadController {
  constructor(
    private readonly fileService: FilesService,
    private readonly fileDownloadService: FileDownloadService,
  ) {}

  @Post()
  async downloadFile(@Body() body: DownloadFileDto, @Res() res: Response) {
    const fileDoc = await this.fileService.getFileByUploadId(body.uploadId);

    const mimeType = fileDoc?.mimeType || 'application/octet-stream'; // fallback

    const stream = await this.fileDownloadService.getStream(fileDoc.key);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.storedName}"`);

    stream.pipe(res);
  }

  @Post('url')
  async downloadFileByURL(@Body() body: DownloadFileDto) {
    const url = this.fileDownloadService.getDownloadLink(body.uploadId);
    return { url };
  }
}
