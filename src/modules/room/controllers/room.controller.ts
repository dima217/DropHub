import { Body, Controller, Post, Delete, UseGuards, Req } from '@nestjs/common';
import type { DeleteRoomBody } from '../interfaces/room-request.interface';
import { RoomService } from '../services/room.service';
import { AuthGuard } from '@nestjs/passport';
import type { RequestWithUser } from 'src/types/express';

@Controller('/room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createRoom(@Req() req: RequestWithUser) {
    return this.roomService.createRoom(req.user.id);
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
