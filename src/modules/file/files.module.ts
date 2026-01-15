import { Module } from '@nestjs/common';
import { FileController } from './controllers/file.controller';
import { FileUploadController } from './controllers/file.upload.controller';
import { FileDownloadController } from './controllers/file.download.controller';
import { FileClientModule } from '../file-client/file-client.module';

@Module({
  imports: [FileClientModule],
  controllers: [FileController, FileUploadController, FileDownloadController],
})
export class FileModule {}
