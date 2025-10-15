import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Room, RoomDocument } from '../schemas/room.schema';
import { UniversalPermissionService } from 'src/modules/permission/services/permission.service';
import { AccessRole, ResourceType } from 'src/modules/permission/entities/permission.entity';

interface AuthenticationDeleteRoomParams {
  userId: number;
  roomId: string;
}

interface AuthenticationCreateRoomParams {
  userId: number;
  username?: string;
}

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    private readonly permissionService: UniversalPermissionService,
  ) {}

  async getRoomsByUserID(userId: number) {
    const permissions = await this.permissionService.getPermissionsByUserIdAndType(
      userId,
      ResourceType.ROOM,
    );

    if (permissions.length === 0) {
      return [];
    }

    const roomIds = permissions.map((p) => p.resourceId);

    const rooms = await this.roomModel
      .find({
        _id: { $in: roomIds },
      })
      .select('-files -__v')
      .lean();

    return rooms.map((room) => ({
      ...room,
      role: permissions.find((p) => p.resourceId === room._id.toString())?.role,
    }));
  }

  async createRoom(params: AuthenticationCreateRoomParams) {
    try {
      const newRoom = new this.roomModel({
        createdAt: new Date(),
        maxBytes: 5000,
        owner: params.username ?? '',
      });

      const savedRoom = await newRoom.save();
      const roomId = savedRoom.id.toString();

      await this.permissionService.createPermission({
        userId: params.userId,
        resourceType: ResourceType.ROOM,
        resourceId: roomId,
        role: AccessRole.ADMIN,
      });

      return {
        success: true,
        roomId,
      };
    } catch (err) {
      throw new InternalServerErrorException('Failed to create room', { cause: err });
    }
  }

  async deleteRoom(params: AuthenticationDeleteRoomParams) {
    if (!params.roomId) {
      throw new BadRequestException('Room ID is required.');
    }

    await this.permissionService.verifyUserAccess(params.userId, params.roomId, ResourceType.ROOM, [
      AccessRole.ADMIN,
    ]);

    try {
      const deletedRoom = await this.roomModel.findByIdAndDelete(params.roomId);

      if (!deletedRoom) {
        throw new NotFoundException('Room not found.');
      }

      await this.permissionService.deletePermissionsByResource(params.roomId, ResourceType.ROOM);

      return { message: 'Room deleted successfully' };
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof ForbiddenException ||
        err instanceof BadRequestException
      ) {
        throw err;
      }
      throw new InternalServerErrorException('Failed to delete room', { cause: err });
    }
  }
}
