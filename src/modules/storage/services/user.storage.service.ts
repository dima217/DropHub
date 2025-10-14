import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserStorageDocument } from '../schemas/storage.schema';
import { Model } from 'mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { StorageItemService } from './storage.item.service';
import {
  AccessRole,
  Permission,
  ResourceType,
} from 'src/modules/permission/entities/permission.entity';
import { UniversalPermissionService } from 'src/modules/permission/services/storage.permission.service';

@Injectable()
export class StorageService {
  constructor(
    @InjectModel('UserStorage') private readonly storageModel: Model<UserStorageDocument>,
    @InjectRepository(Permission)
    private readonly permissionService: UniversalPermissionService,
    private readonly storageItemService: StorageItemService,
  ) {}

  async createStorage(userId: number) {
    const storage = await this.storageModel.create({
      createdAt: Date.now(),
    });
    const storageId = storage._id.toString();
    await this.permissionService.createPermission({
      userId,
      resourceType: ResourceType.STORAGE,
      role: AccessRole.ADMIN,
      resourceId: storageId,
    });
    storage.save();
  }

  async getStoragesByUserId(userId: number) {
    const permissions = await this.permissionService.getPermissionsByUserId(userId);

    const storageIds = permissions.map((p) => p.resourceId);

    const storages = await this.storageModel.find({
      _id: { $in: storageIds },
    });

    return storages.map((s) => ({
      ...s.toObject(),
      role: permissions.find((p) => p.resourceId === s._id.toString())?.role,
    }));
  }

  private async verifyUserAccess(userId: number, storageId: string, requiredRoles: AccessRole[]) {
    await this.permissionService.verifyUserAccess(
      userId,
      storageId,
      ResourceType.STORAGE,
      requiredRoles,
    );
  }

  async createItemInStorage(storageId: string, userId: number) {
    await this.verifyUserAccess(userId, storageId, [AccessRole.ADMIN, AccessRole.WRITE]);

    const item = await this.storageItemService.createItem(storageId, userId);
    return item;
  }
}
