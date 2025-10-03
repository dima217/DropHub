import { Body, Controller, Delete, Post } from '@nestjs/common';
import { FilesService } from '../services/file.service';
import { DeleteFileDto } from '../dto/delete-file.dto';
import { GetFilesDto } from '../dto/get-files.dto';

@Controller('file')
export class FileController {
  constructor(private readonly filesService: FilesService) {}

  @Delete()
  async deleteFile(@Body() dto: DeleteFileDto) {
    const results = await this.filesService.deleteFiles(dto);
    return { success: true, updated: results.length };
  }

  @Post('get-files')
  async getFiles(@Body() dto: GetFilesDto) {
    const files = await this.filesService.getFilesByRoomID(dto);
    return files;
  }
}
