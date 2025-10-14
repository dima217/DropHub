import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessRole, Permission, ResourceType } from '../entities/permission.entity';

interface CreatePermissionParams {
  userId: number;
  resourceId: string;
  resourceType: ResourceType;
  role: AccessRole;
}

@Injectable()
export class UniversalPermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async createPermission(params: CreatePermissionParams) {
    return this.permissionRepository.save({
      resourceId: params.resourceId,
      resourceType: params.resourceType,
      role: params.role,
      user: { id: params.userId },
    } as Permission);
  }

  async getPermissionsByUserIdAndType(userId: number, resourceType: ResourceType) {
    return this.permissionRepository.find({
      where: { user: { id: userId }, resourceType: resourceType },
    });
  }

  async getPermissionsByUserId(userId: number) {
    return this.permissionRepository.find({
      where: { user: { id: userId } },
    });
  }

  async verifyUserAccess(
    userId: number,
    resourceId: string,
    resourceType: ResourceType,
    requiredRoles: AccessRole[],
  ): Promise<boolean> {
    const permission = await this.permissionRepository.findOne({
      where: {
        user: { id: userId },
        resourceId: resourceId,
        resourceType: resourceType,
      },
    });

    if (!permission) {
      throw new NotFoundException(
        `Resource (Type: ${resourceType}, ID: ${resourceId}) not found or no permission.`,
      );
    }

    if (!requiredRoles.includes(permission.role)) {
      throw new ForbiddenException('You do not have access to perform this action.');
    }

    return true;
  }
}
