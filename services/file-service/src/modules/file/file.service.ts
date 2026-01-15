import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File, FileDocument } from './schemas/file.schema';
import { Room, RoomDocument } from '../room/schemas/room.schema';
import { CreateFileMetaDto } from './dto/create-file-meta.dto';
import { DeleteFileDto } from './dto/delete-file.dto';
import { FileUploadStatus } from '../../constants/interfaces';
import {
  PermissionClientService,
  AccessRole,
  ResourceType,
} from '../permission-client/permission-client.service';
import { S3Service } from '../s3/s3.service';
import { S3_BUCKET_TOKEN } from '../s3/s3.tokens';

interface AuthenticatedGettingFilesByRoomParams {
  roomId: string;
  userId: number;
}

@Injectable()
export class FileService {
  constructor(
    private readonly permissionClient: PermissionClientService,
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    private readonly s3Service: S3Service,
    @Inject(S3_BUCKET_TOKEN) private readonly bucket: string,
  ) {}

  async createFileMeta(dto: CreateFileMetaDto) {
    // Файлы в комнатах имеют срок годности (24 часа)
    // Файлы в storage не имеют срока годности (expiresAt = null)
    const expiresAt =
      dto.expiresAt !== undefined ? dto.expiresAt : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const fileDoc = new this.fileModel({
      ...dto,
      uploadTime: new Date(),
      downloadCount: 0,
      expiresAt,
    });

    return fileDoc.save();
  }

  async deleteFiles(dto: DeleteFileDto) {
    if (!dto.fileIds || dto.fileIds.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const updatedFiles = await Promise.all(dto.fileIds.map((fileId) => this.expireFile(fileId)));
    return updatedFiles.filter(Boolean);
  }

  private async expireFile(fileId: string) {
    try {
      return await this.fileModel
        .findByIdAndUpdate(fileId, { $set: { expiresAt: new Date() } }, { new: true })
        .exec();
    } catch (err) {
      console.error(`Failed to expire file ${fileId}`, err);
      return null;
    }
  }

  async getFilesByRoomID(params: AuthenticatedGettingFilesByRoomParams) {
    if (!params.roomId) {
      throw new BadRequestException('No roomId provided');
    }

    await this.permissionClient.verifyUserAccess(params.userId, params.roomId, ResourceType.ROOM, [
      AccessRole.ADMIN,
      AccessRole.READ,
      AccessRole.WRITE,
    ]);

    const room = await this.roomModel
      .findById(params.roomId)
      .populate<{ files: FileDocument[] }>({
        path: 'files',
        select: '-__v-',
        options: { lean: true },
      })
      .exec();

    if (!room) {
      throw new NotFoundException("Room hasn't been found");
    }

    room.files = room.files.filter((file) => !file.expiresAt || file.expiresAt > new Date());

    return room;
  }

  async getFileById(fileId: string) {
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

  /**
   * Получить список истекших файлов
   * Файлы со сроком годности могут быть только в комнатах, не в хранилищах
   */
  async getExpiredFiles(beforeDate?: Date) {
    const date = beforeDate || new Date();
    // Ищем только файлы с expiresAt (т.е. файлы из комнат)
    // Файлы в storage не имеют expiresAt, поэтому они не попадут в выборку
    return this.fileModel
      .find({
        expiresAt: { $lte: date, $ne: null },
      })
      .lean()
      .exec();
  }

  /**
   * Полное удаление файла: из S3, из комнаты (если есть) и из БД
   * Файлы со сроком годности могут быть только в комнатах, не в хранилищах
   */
  async deleteFileCompletely(storedName: string): Promise<void> {
    // Найти файл по storedName
    const file = await this.fileModel.findOne({ storedName }).exec();

    if (!file) {
      console.warn(`File with storedName ${storedName} not found in database`);
      // Все равно пытаемся удалить из S3 на случай, если файл уже удален из БД
      await this.deleteFromS3(storedName);
      return;
    }

    const fileId = (file._id as any).toString();

    // 1. Найти комнату, в которой находится файл (файлы со сроком годности только в комнатах)
    let roomId: string | null = null;
    try {
      const room = await this.roomModel.findOne({ files: fileId }).exec();
      if (room) {
        roomId = (room._id as any).toString();
      }
    } catch (err) {
      console.error(`Error finding room for file: ${fileId}`, err);
    }

    // 2. Удалить из S3
    try {
      await this.deleteFromS3(storedName);
      console.log(`File deleted from S3: ${storedName}`);
    } catch (err) {
      console.error(`Error deleting file from S3: ${storedName}`, err);
      // Продолжаем удаление даже если S3 операция не удалась
    }

    // 3. Удалить из комнаты (если файл был в комнате)
    if (roomId) {
      try {
        await this.roomModel.findByIdAndUpdate(roomId, { $pull: { files: fileId } }).exec();
        console.log(`File removed from room ${roomId}: ${fileId}`);
      } catch (err) {
        console.error(`Error removing file from room ${roomId}: ${fileId}`, err);
      }
    }

    // 4. Удалить из БД
    try {
      await this.fileModel.findByIdAndDelete(fileId).exec();
      console.log(`File deleted from database: ${fileId}`);
    } catch (err) {
      console.error(`Error deleting file from database: ${fileId}`, err);
      throw err;
    }
  }

  /**
   * Удаление файла из S3
   */
  private async deleteFromS3(key: string): Promise<void> {
    try {
      await this.s3Service.delete({
        Bucket: this.bucket,
        Key: key,
      });
    } catch (err) {
      console.error(`Failed to delete file from S3: ${key}`, err);
      throw err;
    }
  }
}
