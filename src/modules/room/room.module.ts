import { Module } from '@nestjs/common';
import { RoomController } from './controllers/room.controller';
import { RoomService } from './services/room.service';
import { UniversalPermissionService } from '../permission/services/permission.service';

@Module({
  controllers: [RoomController],
  providers: [RoomService],
  imports: [UniversalPermissionService],
  exports: [RoomService],
})
export class RoomModule {}
