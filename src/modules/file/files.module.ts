import { Module } from '@nestjs/common';
import { S3Module } from 'src/modules/s3/s3.module';
import { FileController } from './controllers/file.controller';
import { FileUploadController } from './controllers/file.upload.controller';
import { FileDownloadController } from './controllers/file.download.controller';
import { FilesService } from './services/file.service';
import { DownloadService } from './services/download/download.service';
import { UploadService } from './services/upload/upload.service';
import { StorageService } from '../storage/services/storage.service';
import { RoomService } from '../room/services/room.service';

@Module({
  imports: [S3Module, StorageService, RoomService],
  controllers: [FileController, FileUploadController, FileDownloadController],
  providers: [FilesService, DownloadService, UploadService],
  exports: [FilesService, DownloadService, UploadService],
})
export class FileModule {}
