import {
    Body,
    Controller,
    Post,
    UseInterceptors,
    Req,
  } from "@nestjs/common";
import type { Request } from "express";
import { FileUploadService } from "../services/file.upload.service";
import { UploadInitDto } from "../dto/upload/upload.init.dto";
import { UploadInitMultipartDto } from "../dto/upload/upload.init.multipart.dto";
import { UploadCompleteDto } from "../dto/upload/upload.complete.dto";
import { UserIpInterceptor } from "src/common/interceptors/user.ip.interceptor";
import { UploadToS3Dto } from "../dto/upload/upload.s3.dto";
  
  @Controller("/upload")
  export class FileUploadController {
    constructor(private readonly filesUploadService: FileUploadService) {}
  
    @Post()
    @UseInterceptors(UserIpInterceptor)
    async uploadFile(
      @Body("roomId") s3UploadData: UploadToS3Dto,
      @Req() req: Request,
    ) {
      const uploadData = {
        ...s3UploadData, 
        uploaderIp: req.userIp
      }
      await this.filesUploadService.uploadFileToS3AndSaveMetadata(uploadData);
  
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
  