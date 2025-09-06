import {
    Body,
    Controller,
    Post,
    HttpException,
    HttpStatus,
    Res,
  } from "@nestjs/common";
import type { Response } from "express";
import { File, FileDocument } from "../schemas/file.schema";
import type { downloadInterface } from "../interfaces/file-request.interface";
import { FileDownloadService } from '../services/file.download.service';
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
  
  @Controller("/download")
  export class FileDownloadController {
    constructor(
        private readonly fileDownloadService: FileDownloadService,
        @InjectModel(File.name) private readonly fileModel: Model<FileDocument>
    ) {}
    
    @Post()
    async downloadFile(
      @Body() body: downloadInterface,
      @Res() res: Response
    ) {
      try {
        const key = body.key;
        const fileDoc = await this.fileModel.findOne({ key }).lean();
  
        if (!fileDoc) {
          throw new HttpException(
            { error: "File doc does not exist" },
            HttpStatus.NOT_FOUND
          );
        }
  
        const mimeType =
          fileDoc?.mimeType || "application/octet-stream"; // fallback
  
        const stream = await this.fileDownloadService.getStream(body.key);
  
        if (!stream) {
          throw new HttpException(
            { error: "File not found in S3" },
            HttpStatus.NOT_FOUND
          );
        }
  
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Disposition", `attachment; filename="${key}"`);

        stream.pipe(res);
      } catch (err) {
        throw new HttpException(
          { error: "Could not upload file", details: err },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Post("url")
    async downloadFileByURL(@Body() body: downloadInterface) {
      try {
        const url = this.fileDownloadService.getDownloadLink(body.key);
        return { url };
      } catch (err) {
        throw new HttpException(
          { error: "Could not upload file2", details: err },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }
  