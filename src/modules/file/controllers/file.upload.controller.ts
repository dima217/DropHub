import {
    Body,
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Req,
  } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { FileUploadService } from "../services/file.upload.service";
import { UploadInitDto } from "../dto/upload/upload.init.dto";
import { UploadInitMultipartDto } from "../dto/upload/upload.init.multipart.dto";
import { UploadCompleteDto } from "../dto/upload/upload.complete.dto";
  
  @Controller("/upload")
  export class FileUploadController {
    constructor(private readonly filesUploadService: FileUploadService) {}
  
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
      @UploadedFile() file: Express.Multer.File,
      @Body("roomId") roomId: string,
      @Req() req: Request
    ) {
      await this.filesUploadService.uploadFileToS3AndSaveMetadata({
        file,
        roomId,
        uploaderIp: req.ip ?? 'none',
      });
  
      return { success: true, message: "File uploaded successfully" };
    }
  
    @Post("init")
    async uploadInit(@Body() body: UploadInitDto) {
      const strategy = await this.filesUploadService.initUploading(
        body.fileSize
      );  
      return { success: true, strategy };
    }
  
    @Post("multipart/init")
    async uploadMultipartInit(@Body() body: UploadInitMultipartDto, @Req() req: Request) {
      const initRes = await this.filesUploadService.initUploadMultipart(body, req.ip ?? 'none');
      return { success: true, data: initRes };
    }
  
    @Post("multipart/complete")
    async uploadComplete(@Body() body: UploadCompleteDto, @Req() req: Request) {
      const ip = req.ip;
      await this.filesUploadService.completeMultipart(body);
  
      return { success: true, message: "Multipart upload completed" };
    }
  }
  