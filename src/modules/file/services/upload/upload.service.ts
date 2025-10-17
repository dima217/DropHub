import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File, FileDocument } from '../../schemas/file.schema';
import { S3Service } from 'src/modules/s3/s3.service';
import { UploadData } from '../../interfaces/file-request.interface';
import { FilesService } from '../file.service';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_BUCKET_TOKEN } from 'src/modules/s3/s3.tokens';
import { StorageService } from 'src/modules/storage/services/storage.service';
import { TokenService } from 'src/modules/token/services/token.service';
import { ResourceType } from 'src/modules/permission/entities/permission.entity';
import { UniversalPermissionService } from 'src/modules/permission/services/permission.service';
import { AccessRole } from 'src/modules/permission/entities/permission.entity';
import { RoomService } from 'src/modules/room/services/room.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly roomService: RoomService,
    private readonly storageService: StorageService,
    private readonly permissionService: UniversalPermissionService,
    private readonly fileService: FilesService,
    private readonly tokenService: TokenService,
    @Inject(S3_BUCKET_TOKEN) private readonly bucket: string,
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
  ) {}

  async getPresignedUrl(filename: string, contentType: string) {
    const key = `uploads/${Date.now()}-${filename}`;

    const url = await getSignedUrl(
      this.s3Service.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 3600 },
    );

    return { url, key };
  }

  async uploadFileToRoom(params: UploadData) {
    const { fileSize, mimeType, uploaderIp, originalName, userId, roomId } = params;
    const resourceId = roomId;
    const resourceType = ResourceType.ROOM;

    if (!fileSize || !resourceId || !resourceType || !userId) {
      throw new BadRequestException({ error: 'Missing file details or user ID' });
    }

    await this.permissionService.verifyUserAccess(userId, resourceId, resourceType, [
      AccessRole.ADMIN,
      AccessRole.WRITE,
    ]);

    const { url, key } = await this.getPresignedUrl(originalName, mimeType);

    const fileUploadMeta = await this.fileService.createFileMeta({
      originalName: originalName,
      key: key,
      size: fileSize,
      mimeType: mimeType,
      uploaderIp,
    });

    await this.roomService.bindFileToRoom(resourceId, fileUploadMeta._id as string);

    return { url };
  }

  async uploadFileToStorage(params: UploadData) {
    const { fileSize, mimeType, uploaderIp, originalName, userId, storageId } = params;
    const resourceId = storageId;
    const resourceType = ResourceType.STORAGE;

    if (!fileSize || !resourceId || !resourceType || !userId) {
      throw new BadRequestException({ error: 'Missing file details or user ID' });
    }

    await this.permissionService.verifyUserAccess(userId, resourceId, resourceType, [
      AccessRole.ADMIN,
      AccessRole.WRITE,
    ]);

    const { url, key } = await this.getPresignedUrl(originalName, mimeType);

    const fileUploadMeta = await this.fileService.createFileMeta({
      originalName: originalName,
      key: key,
      size: fileSize,
      mimeType: mimeType,
      uploaderIp,
    });

    await this.storageService.createItemInStorage({
      storageId: resourceId,
      userId: userId,
      name: originalName,
      isDirectory: false,
      parentId: null,
      fileId: fileUploadMeta._id as string,
    });

    return { url };
  }

  async uploadFileByToken(params: UploadData) {
    const { uploadToken } = params;

    if (!uploadToken) {
      throw new BadRequestException('Upload token is required.');
    }

    const payload = await this.tokenService.validateToken(uploadToken);

    if (!payload || !payload.resourceId || !payload.resourceType) {
      throw new UnauthorizedException('Invalid or expired upload token.');
    }

    const targetParams: UploadData = {
      ...params,
      roomId: payload.resourceType === ResourceType.ROOM ? payload.resourceId : undefined,
      storageId: payload.resourceType === ResourceType.STORAGE ? payload.resourceId : undefined,
    };

    if (targetParams.roomId) {
      return this.uploadFileToRoom(targetParams);
    } else if (targetParams.storageId) {
      return this.uploadFileToStorage(targetParams);
    } else {
      throw new BadRequestException('Token target is not supported for single upload.');
    }
  }

  async cancelUpload(roomId: string, uploadId: string) {
    await this.fileModel.findOneAndUpdate(
      { roomId: roomId, 'uploadSession.uploadId': uploadId },
      { $set: { 'uploadSession.status': 'canceled' } },
    );
  }
}
