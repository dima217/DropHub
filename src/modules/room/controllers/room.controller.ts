import { Body, Controller, Post, Delete, UseGuards, Req } from '@nestjs/common';
import type { DeleteRoomBody } from '../interfaces/room-request.interface';
import { RoomService } from '../services/room.service';
import { AuthGuard } from '@nestjs/passport';
import type { RequestWithUser } from 'src/types/express';
import { CreateRoomDto } from '../dto/create-room.dro';

@Controller('/room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createRoom(@Req() req: RequestWithUser, @Body() body: CreateRoomDto) {
    const createData = {
      userId: req.user.id,
      username: body.username,
    };
    return this.roomService.createRoom(createData);
  }

  @Delete()
  @UseGuards(AuthGuard)
  async deleteRoom(@Req() req: RequestWithUser, @Body() body: DeleteRoomBody) {
    const deleteData = {
      roomId: body.roomId,
      userId: req.user.id,
    };
    return this.roomService.deleteRoom(deleteData);
  }
}
