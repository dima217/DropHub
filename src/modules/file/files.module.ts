import { Module } from "@nestjs/common";
import { S3Module } from "src/s3/s3.module";
import { FileController } from "./controllers/file.controller";
import { FileUploadController } from "./controllers/file.upload.controller";
import { FileDownloadController } from "./controllers/file.download.controller";
import { FilesService } from "./services/file.service";
import { FileDownloadService } from "./services/file.download.service";
import { FileUploadService } from "./services/file.upload.service"; 

@Module({
  imports: [S3Module],
  controllers: [FileController, FileUploadController, FileDownloadController],
  providers: [FilesService, FileDownloadService, FileUploadService],
  exports: [FilesService, FileDownloadService, FileUploadService], 
})
export class FileModule {}
