import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export enum AccessRole {
  ADMIN = 'admin',
  WRITE = 'write',
  READ = 'read',
}

export enum ResourceType {
  ROOM = 'room',
  STORAGE = 'storage',
  FILE = 'file',
  INVITE = 'invite',
}

interface VerifyAccessPayload {
  userId: number;
  resourceId: string;
  resourceType: ResourceType;
  requiredRoles: AccessRole[];
}

@Injectable()
export class PermissionClientService {
  constructor(
    @Inject('PERMISSION_SERVICE') private readonly permissionClient: ClientProxy,
  ) {}

  async verifyUserAccess(
    userId: number,
    resourceId: string,
    resourceType: ResourceType,
    requiredRoles: AccessRole[],
  ): Promise<boolean> {
    try {
      const payload: VerifyAccessPayload = {
        userId,
        resourceId,
        resourceType,
        requiredRoles,
      };

      const result = await firstValueFrom(
        this.permissionClient.send('permission.verify', payload),
      );

      return result === true;
    } catch (error) {
      console.error('Permission verification error:', error);
      throw error;
    }
  }
}

