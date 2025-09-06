import { Body, Controller, Delete, HttpException, HttpStatus, Post } from "@nestjs/common";
import type { DeleteFileBody } from "../services/file.service";
import type { GetFilesBody } from "../interfaces/file-request.interface";
import { FilesService } from '../services/file.service';

@Controller('file')
export class FileController {
    constructor(
        private readonly filesService: FilesService,
    ) {}

    @Delete()
    async deleteFile(@Body() body: DeleteFileBody) {
        const { files } = body;

        if (!files || files.length === 0) {
            throw new HttpException(
                {error: "No files provided"},
                HttpStatus.BAD_REQUEST
            );
        }
        try {
            const results = await this.filesService.deleteFiles({ files });
            return { success: true, updated: results.length };
          } catch (err) {
            throw new HttpException(
              { error: "Failed to delete files", details: err },
              HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('get-files')
    async getFiles(@Body() body: GetFilesBody) {
    const { roomId } = body;

    if (!roomId) {
      throw new HttpException(
        { error: "No roomId provided" },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const files = await this.filesService.getFilesByRoomID(roomId);
      return files;
    } catch (err) {
      throw new HttpException(
        { error: "Failed reaching room", details: err },
        HttpStatus.NOT_FOUND
      );
    }
  }
}