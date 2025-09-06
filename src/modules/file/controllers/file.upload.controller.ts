import {
    Body,
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Req,
    HttpException,
    HttpStatus,
  } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { FilesUploadService } from "../services/file.upload.service";
import type {
    UploadComplete,
    UploadInitMultipart,
    UploadInitRequestBody,
} from "../interfaces/file-request.interface";

  
  @Controller("/upload")
  export class FileUploadController {
    constructor(private readonly filesUploadService: FilesUploadService) {}
  
    @Post()
    @UseInterceptors(FileInterceptor("file"))
    async uploadFile(
      @UploadedFile() file: Express.Multer.File,
      @Body("roomId") roomId: string,
      @Req() req: Request
    ) {
      try {
        const ip = req.ip;
  
        if (!file || !roomId) {
          throw new HttpException(
            { error: "Missing 'file' or 'roomId'" },
            HttpStatus.BAD_REQUEST
          );
        }
  
        await this.filesUploadService.uploadFileToS3AndSaveMetadata({
          file,
          roomId,
          uploaderIp: ip ?? 'none',
        });
  
        return { success: true, message: "File uploaded successfully" };
      } catch (err) {
        throw new HttpException(
          { error: "Internal Server Error", details: err?.message ?? err },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Post("init")
    async uploadInit(@Body() body: UploadInitRequestBody) {
      try {
        const strategy = await this.filesUploadService.initUploading(
          body.fileSize
        );
  
        if (!strategy) {
          throw new HttpException(
            { error: "No strategy returned" },
            HttpStatus.BAD_REQUEST
          );
        }
  
        return { success: true, strategy };
      } catch (err) {
        throw new HttpException(
          { error: "Could not init upload", details: err?.message ?? err },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Post("multipart/init")
    async uploadMultipartInit(@Body() body: UploadInitMultipart) {
      try {
        const initRes = await this.filesUploadService.initUploadMultipart(
          body.fileName,
          body.totalParts
        );
  
        if (!initRes) {
          throw new HttpException(
            { error: "Init multipart failed" },
            HttpStatus.BAD_REQUEST
          );
        }
  
        return { success: true, data: initRes };
      } catch (err) {
        throw new HttpException(
          { error: "Could not init multipart upload", details: err?.message ?? err },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  

    @Post("multipart/complete")
    async uploadComplete(@Body() body: UploadComplete, @Req() req: Request) {
      try {
        const ip = req.ip;
        await this.filesUploadService.completeMultipart(body, ip ?? 'none');
  
        return { success: true, message: "Multipart upload completed" };
      } catch (err) {
        throw new HttpException(
          { error: "Could not complete multipart upload", details: err?.message ?? err },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }
  