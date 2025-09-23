import {
    Body,
    Controller,
    Post,
    Res,
  } from "@nestjs/common";
import type { Response } from "express";
import { File, FileDocument } from "../schemas/file.schema";
import { FileDownloadService } from '../services/file.download.service';
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { DownloadFileDto } from "../dto/download/download.file.dto";
import { FilesService } from "../services/file.service";
  
  @Controller("/download")
  export class FileDownloadController {
    constructor(
        private readonly fileService: FilesService,
        private readonly fileDownloadService: FileDownloadService,
        @InjectModel(File.name) private readonly fileModel: Model<FileDocument>
    ) {}

    @Post()
    async downloadFile(
      @Body() body: DownloadFileDto,
      @Res() res: Response
    ) {
      const key = body.key;
      const fileDoc = await this.fileService.getFileByKey(key);
  
      const mimeType = fileDoc?.mimeType || "application/octet-stream"; // fallback
  
      const stream = await this.fileDownloadService.getStream(body.key);
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${key}"`);

      stream.pipe(res);
    }
  
    @Post("url")
    async downloadFileByURL(@Body() body: DownloadFileDto) {
      const url = this.fileDownloadService.getDownloadLink(body.key);
      return { url };
    }
  }
  