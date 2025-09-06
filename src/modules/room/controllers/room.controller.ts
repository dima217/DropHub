import { Body, Controller, Post, Delete } from "@nestjs/common";
import type { DeleteRoomBody } from "../interfaces/room-request.interface";
import { RoomService } from "../services/room.service";

@Controller("/room")
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  async createRoom() {
    return this.roomService.createRoom();
  }

  @Delete()
  async deleteRoom(@Body() body: DeleteRoomBody) {
    const { roomId } = body;
    return this.roomService.deleteRoom(roomId);
  }
}
