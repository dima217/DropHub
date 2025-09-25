import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserStorageDocument } from "../schemas/storage.schema";
import { Model } from "mongoose";
import { InjectRepository } from "@nestjs/typeorm";
import { StoragePermission } from "../entities/storage.permission";
import { Repository } from "typeorm";

@Injectable()
export class UserStorageService {
    constructor(
        @InjectModel("UserStorage") private readonly storageModel: Model<UserStorageDocument>,
        @InjectRepository(StoragePermission)
        private permissionsRepository: Repository<StoragePermission>,
    ) {}

    async getUserStorages(userId: number) {
        const permissions = await this.permissionsRepository.find({
          where: { user: { id: userId } },
          select: ['storageId', 'role'],
        });
      
        if (!permissions.length) return [];
      
        const storageIds = permissions.map((p) => p.storageId);
      
        const storages = await this.storageModel.find({
          _id: { $in: storageIds },
        });
      
        return storages.map((s) => ({
          ...s.toObject(),
          role: permissions.find((p) => p.storageId === s._id.toString())?.role,
        }));
    }
}      