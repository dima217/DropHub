import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { StorageService } from './services/user.storage.service';

@Controller()
export class StorageItemListener {
  constructor(private readonly storageItemService: StorageService) {}

  @EventPattern('storage.item.created')
  async handleItemCreated(@Payload() data: any) {
    const { storageId, userId } = data;

    if (!storageId || !userId) {
      console.warn('Invalid message data', data);
      return;
    }
    await this.storageItemService.createItemInStorage(storageId, userId);
  }
}
