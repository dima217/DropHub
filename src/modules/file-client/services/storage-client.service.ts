import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class StorageClientService {
  constructor(@Inject('FILE_SERVICE') private readonly fileClient: ClientProxy) {}

  async createStorage(userId: number) {
    return firstValueFrom(this.fileClient.send('storage.create', { userId }));
  }

  async createStorageItem(data: {
    storageId: string;
    userId: number;
    name: string;
    isDirectory: boolean;
    parentId: string | null;
    fileId: string | null;
  }) {
    return firstValueFrom(this.fileClient.send('storage.createItem', data));
  }

  async getStorageStructure(data: { storageId: string; parentId: string | null; userId: number }) {
    return firstValueFrom(this.fileClient.send('storage.getStructure', data));
  }

  async getFullStorageStructure(storageId: string, userId: number) {
    return firstValueFrom(this.fileClient.send('storage.getFullStructure', { storageId, userId }));
  }

  async deleteStorageItem(data: { storageId: string; itemId: string; userId: number }) {
    return firstValueFrom(this.fileClient.send('storage.deleteItem', data));
  }

  async getStorageItemByToken(token: string) {
    return firstValueFrom(this.fileClient.send('storage.getItemByToken', { token }));
  }

  async getStoragesByUserId(userId: number) {
    return firstValueFrom(this.fileClient.send('storage.getByUserId', { userId }));
  }
}
