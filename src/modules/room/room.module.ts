import { Module } from '@nestjs/common';
import { RoomController } from './controllers/room.controller';
import { FileClientModule } from '../file-client/file-client.module';

@Module({
  imports: [FileClientModule],
  controllers: [RoomController],
})
export class RoomModule {}
