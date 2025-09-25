import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StoragePermission } from "../entities/storage.permission";
import { PermissionData } from "../interfaces/user.storage-request.interface";

@Injectable()
export class StoragePermissionService {
    constructor(
        @InjectRepository(StoragePermission)
        private permissionsRepository: Repository<StoragePermission>,
    ) {}

    async createPermission(data: PermissionData) {
        const permission = this.permissionsRepository.create({
            storageId: data.storageId,
            user: { id: data.userId },
            role: data.role,
          });
      
        return this.permissionsRepository.save(permission);
    }

    async getPermissionsByUserId(userId: number) {
        const permissions = await this.permissionsRepository.find({
            where: { user: { id: userId } },
            select: ['storageId', 'role'],
          });
        
        if (!permissions.length) return [];
        
        return permissions;
    }
}