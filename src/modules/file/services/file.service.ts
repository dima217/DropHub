import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File, FileDocument } from '../schemas/file.schema';
import { Room, RoomDocument } from '../../room/schemas/room.schema';
import { CreateFileMetaDto } from '../dto/create-file-meta.dto';
import { DeleteFileDto } from '../dto/delete-file.dto';
import { FileUploadStatus } from 'src/constants/interfaces';
import { UniversalPermissionService } from 'src/modules/permission/services/permission.service';
import { AccessRole, ResourceType } from 'src/modules/permission/entities/permission.entity';

interface AuthenticatedGettingFilesByRoomParams {
  roomId: string;
  userId: number;
}

@Injectable()
export class FilesService {
  constructor(
    private readonly permissionService: UniversalPermissionService,
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
  ) {}

  async createFileMeta(dto: CreateFileMetaDto) {
    const fileDoc = new this.fileModel({
      ...dto,
      uploadTime: new Date(),
      downloadCount: 0,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return fileDoc.save();
  }

  async deleteFiles(dto: DeleteFileDto) {
    if (!dto.uuid || dto.uuid.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const updatedFiles = await Promise.all(dto.uuid.map((fileUuid) => this.expireFile(fileUuid)));

    return updatedFiles.filter(Boolean);
  }

  private async expireFile(fileUuid: string) {
    try {
      return await this.fileModel
        .findOneAndUpdate({ uuid: fileUuid }, { $set: { expiresAt: new Date() } }, { new: true })
        .exec();
    } catch (err) {
      console.error(`Failed to expire file ${fileUuid}`, err);
      return null;
    }
  }

  async getFilesByRoomID(params: AuthenticatedGettingFilesByRoomParams) {
    if (!params.roomId) {
      throw new BadRequestException('No roomId provided');
    }

    await this.permissionService.verifyUserAccess(params.userId, params.roomId, ResourceType.ROOM, [
      AccessRole.ADMIN,
      AccessRole.READ,
      AccessRole.WRITE,
    ]);

    const room = await this.roomModel
      .findById(params.roomId)
      .populate<{ files: FileDocument[] }>({
        path: 'files',
        select: '-id- -__v-',
      })
      .exec();

    if (!room) {
      throw new NotFoundException("Room hasn't been found");
    }

    room.files = room.files.filter((file) => !file.expiresAt || file.expiresAt > new Date());

    return room;
  }

  async getFileByUuid(fileId: string) {
    const fileDoc = await this.fileModel.findById(fileId).lean();

    if (!fileDoc) {
      throw new NotFoundException({ error: 'File does not exist' });
    }

    if (fileDoc.expiresAt && fileDoc.expiresAt <= new Date()) {
      throw new NotFoundException({ error: 'File has expired' });
    }

    if (fileDoc.uploadSession.status !== FileUploadStatus.COMPLETE) {
      throw new BadRequestException({ error: 'File upload not completed' });
    }

    return fileDoc;
  }

  async getFileByUploadId(uploadId: string) {
    const fileDoc = await this.fileModel.findOne({ 'uploadSession.uploadId': uploadId }).lean();

    if (!fileDoc) {
      throw new NotFoundException({ error: 'File doc does not exist' });
    }

    if (fileDoc.expiresAt && fileDoc.expiresAt <= new Date()) {
      throw new NotFoundException({ error: 'File has expired' });
    }
    if (fileDoc.uploadSession.status !== FileUploadStatus.COMPLETE) {
      throw new BadRequestException({ error: 'File upload not completed' });
    }

    return fileDoc;
  }
}
