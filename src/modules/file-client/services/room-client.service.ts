import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RoomClientService {
  constructor(@Inject('FILE_SERVICE') private readonly fileClient: ClientProxy) {}

  async createRoom(data: { userId: number; username?: string }) {
    return firstValueFrom(this.fileClient.send('room.create', data));
  }

  async getRoomsByUserId(userId: number) {
    return firstValueFrom(this.fileClient.send('room.getByUserId', { userId }));
  }

  async bindFileToRoom(roomId: string, fileId: string) {
    return firstValueFrom(this.fileClient.send('room.bindFile', { roomId, fileId }));
  }

  async deleteRoom(data: { roomId: string; userId: number }) {
    return firstValueFrom(this.fileClient.send('room.delete', data));
  }
}
