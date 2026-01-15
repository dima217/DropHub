import { Body, Controller, Post, Delete, UseGuards, Req } from '@nestjs/common';
import type { DeleteRoomBody } from '../interfaces/room-request.interface';
import { RoomClientService } from '../../file-client/services/room-client.service';
import { AuthGuard } from '@nestjs/passport';
import type { RequestWithUser } from 'src/types/express';
import { CreateRoomDto } from '../dto/create-room.dro';

@Controller('/room')
export class RoomController {
  constructor(private readonly roomClient: RoomClientService) {}

  @UseGuards(AuthGuard)
  @Post('my-list')
  async getMyRooms(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    const rooms = await this.roomClient.getRoomsByUserId(userId);
    return { success: true, rooms };
  }

  @Post()
  @UseGuards(AuthGuard)
  async createRoom(@Req() req: RequestWithUser, @Body() body: CreateRoomDto) {
    const createData = {
      userId: req.user.id,
      username: body.username,
    };
    return this.roomClient.createRoom(createData);
  }

  @Delete()
  @UseGuards(AuthGuard)
  async deleteRoom(@Req() req: RequestWithUser, @Body() body: DeleteRoomBody) {
    const deleteData = {
      roomId: body.roomId,
      userId: req.user.id,
    };
    return this.roomClient.deleteRoom(deleteData);
  }
}
