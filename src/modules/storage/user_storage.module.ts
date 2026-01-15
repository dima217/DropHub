import { Module } from '@nestjs/common';
import { UserStorageController, PublicStorageController } from './controllers/storage.controller';
import { FileClientModule } from '../file-client/file-client.module';

@Module({
  imports: [FileClientModule],
  controllers: [UserStorageController, PublicStorageController],
})
export class UserStorageModule {}
