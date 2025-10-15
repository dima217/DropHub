import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StorageItem } from '../schemas/storage.item.schema';

@Injectable()
export class StorageItemService {
  constructor(@InjectModel('StorageItem') private readonly itemModel: Model<StorageItem>) {}

  async createItem(storageId: string) {
    const item = await this.itemModel.create({
      storageId,
      // fileId: uploaded.id,
      createdAt: new Date(),
      // createdBy: userId,
    });
    return item;
  }
}
