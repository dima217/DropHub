import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserStorageDocument } from '../schemas/storage.schema';
import { Model } from 'mongoose';
import { StorageItemService } from './storage.item.service';
import { AccessRole, ResourceType } from 'src/modules/permission/entities/permission.entity';
import { UniversalPermissionService } from 'src/modules/permission/services/permission.service';
import { StorageItem } from '../schemas/storage.item.schema';

interface GetStorageItemsParams {
  storageId: string;
  parentId: string | null;
  userId: number;
}

interface DeleteStorageItemParams {
  storageId: string;
  itemId: string;
  userId: number;
}

interface CreateItemParams {
  storageId: string;
  name: string;
  isDirectory: boolean;
  parentId: string | null;
  fileId: string | null;
  userId: number;
}

@Injectable()
export class StorageService {
  constructor(
    @InjectModel('UserStorage') private readonly storageModel: Model<UserStorageDocument>,
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
    return storage;
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

  async getFullStorageStructure(storageId: string, userId: number): Promise<StorageItem[]> {
    await this.verifyUserAccess(userId, storageId, [
      AccessRole.ADMIN,
      AccessRole.READ,
      AccessRole.WRITE,
    ]);

    const items = await this.storageItemService.getAllItemsByStorageId(storageId);

    return items;
  }

  async getStorageStructure(params: GetStorageItemsParams): Promise<StorageItem[]> {
    await this.verifyUserAccess(params.userId, params.storageId, [
      AccessRole.ADMIN,
      AccessRole.READ,
      AccessRole.WRITE,
    ]);

    const items = await this.storageItemService.getItemsByParent(params.parentId);

    return items;
  }

  async deleteStorageItem(params: DeleteStorageItemParams) {
    await this.verifyUserAccess(params.userId, params.storageId, [
      AccessRole.ADMIN,
      AccessRole.WRITE,
    ]);

    const item = await this.storageItemService.getItemById(params.itemId);

    if (item.storageId !== params.storageId) {
      throw new ForbiddenException('Invalid storage item or ownership mismatch.');
    }

    await this.storageItemService.deleteItem(params.itemId);

    return { success: true, itemId: params.itemId };
  }

  async createItemInStorage(params: CreateItemParams): Promise<StorageItem> {
    const { storageId, userId, name, isDirectory, parentId, fileId } = params;

    await this.permissionService.verifyUserAccess(userId, storageId, ResourceType.STORAGE, [
      AccessRole.ADMIN,
      AccessRole.WRITE,
    ]);

    if (!isDirectory && !fileId) {
      throw new BadRequestException('File items must have a fileId.');
    }

    const item = await this.storageItemService.createItem(
      name,
      isDirectory,
      parentId,
      fileId,
      userId.toString(),
      storageId,
    );

    return item;
  }
}
