import { Module } from '@nestjs/common';
import { UserStorageController } from './controllers/user.storage.controller';
import { StorageService } from './services/storage.service';
import { FileModule } from '../file/files.module';

@Module({
  controllers: [UserStorageController],
  providers: [StorageService],
  imports: [FileModule],
})
export class UserStorageModule {}
