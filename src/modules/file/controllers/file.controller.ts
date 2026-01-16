import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { FilesService } from '../services/file.service';
import { DeleteFileDto } from '../dto/delete-file.dto';
import { GetFilesDto } from '../dto/get-files.dto';
import { AuthGuard } from '@nestjs/passport';
import type { RequestWithUser } from 'src/types/express';

@Controller('file')
export class FileController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  async deleteFile(@Body() dto: DeleteFileDto) {
    const results = await this.filesService.deleteFiles(dto);
    return { success: true, updated: results.length };
  }

  @UseGuards(AuthGuard)
  @Post('get-files')
  async getFiles(@Body() dto: GetFilesDto, @Req() req: RequestWithUser) {
    const filesDownloadData = {
      userId: req.user.id,
      roomId: dto.roomId,
    };
    const files = await this.filesService.getFilesByRoomID(filesDownloadData);
    return files;
  }
}
