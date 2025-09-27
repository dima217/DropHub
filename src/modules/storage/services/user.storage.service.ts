import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserStorageDocument } from "../schemas/storage.schema";
import { Model } from "mongoose";
import { InjectRepository } from "@nestjs/typeorm";
import { StoragePermission } from "../entities/storage.permission";
import { StoragePermissionService } from "./storage.permission.service";
import { StorageRole } from '../interfaces/user.storage-request.interface';

@Injectable()
export class UserStorageService {
    constructor(
        @InjectModel("UserStorage") private readonly storageModel: Model<UserStorageDocument>,
        @InjectRepository(StoragePermission)
        private readonly permissionsService: StoragePermissionService,
    ) {}

    async createStorage(userId: number) {
        const storage = await this.storageModel.create({
            createdAt: Date.now(),
        });
        const storageId = storage._id.toString();
        await this.permissionsService.createPermission({ 
          userId, 
          role: StorageRole.ADMIN, 
          storageId 
        });
        storage.save();
    }

    async addItem(userId: number) {
        
    }

    async getStoragesByUserId(userId: number) {
        const permissions = await this.permissionsService.getPermissionsByUserId(userId);
      
        const storageIds = permissions.map((p) => p.storageId);
      
        const storages = await this.storageModel.find({
          _id: { $in: storageIds },
        });
      
        return storages.map((s) => ({
          ...s.toObject(),
          role: permissions.find((p) => p.storageId === s._id.toString())?.role,
        }));
    }

    async addItem(userId: number, storageId: string, file: Express.Multer.File, meta?: Record<string, any>) {
      await this.verifyUserAccess(userId, storageId, [StorageRole.ADMIN, StorageRole.WRITE]);
  
      if (!file) throw new BadRequestException("File is required");
  
      const uploaded = await this.filesService.uploadFile(file);
  
      const item = await this.itemModel.create({
        storageId,
        fileId: uploaded.id,
        meta: meta || {},
        createdAt: new Date(),
        createdBy: userId,
      });
  
      return item;
    }

    async verifyUserAccess(userId: number, storageId: string, requiredRoles: StorageRole[]) {
      const permissions = await this.permissionsService.getPermissionsByUserId(userId);
  
      const permission = permissions.find(p => p.storageId === storageId);
      if (!permission) throw new NotFoundException("Storage not found or no permission.");
  
      if (!requiredRoles.includes(permission.role)) {
        throw new ForbiddenException("You do not have access to perform this action.");
      }
  
      return true;
    }
}      