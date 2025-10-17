import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File, FileDocument } from '../../schemas/file.schema';
import { Room, RoomDocument } from '../../../room/schemas/room.schema';
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

@Injectable()
export class UploadService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly storageService: StorageService,
    private readonly permissionService: UniversalPermissionService,
    private readonly fileService: FilesService,
    private readonly tokenService: TokenService,
    @Inject(S3_BUCKET_TOKEN) private readonly bucket: string,
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
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

  private async bindFileToResource(resourceId: string, resourceType: ResourceType, fileId: string) {
    if (resourceType === ResourceType.ROOM) {
      await this.roomModel.findByIdAndUpdate(resourceId, {
        $push: { files: fileId },
      });
    } else if (resourceType === ResourceType.STORAGE) {
      await this.storageService.createItemInStorage(resourceId);
    }
  }

  async uploadFileToS3AndSaveMetadata(params: UploadData) {
    const { fileSize, mimeType, uploaderIp, originalName, userId } = params;

    const resourceId = params.roomId || params.storageId;
    const resourceType = params.roomId
      ? ResourceType.ROOM
      : params.storageId
        ? ResourceType.STORAGE
        : null;

    if (!fileSize || !resourceId || !resourceType) {
      throw new BadRequestException({ error: 'Missing file details or resource identifier' });
    }

    if (userId) {
      await this.permissionService.ensureAdminPermissionExists(resourceId, resourceType, userId);
    }

    const { url, key } = await this.getPresignedUrl(originalName, mimeType);

    const fileUploadMeta = await this.fileService.createFileMeta({
      originalName: originalName,
      key: key,
      size: fileSize,
      mimeType: mimeType,
      uploaderIp,
    });

    await this.bindFileToResource(resourceId, resourceType, fileUploadMeta._id as string);

    return { url };
  }

  async uploadFileByToken(params: UploadData) {
    const { uploadToken } = params;

    if (!uploadToken) {
      throw new BadRequestException('Upload token is required.');
    }

    const payload = await this.tokenService.validateToken(uploadToken);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired upload token.');
    }

    const authenticatedParams: UploadData = {
      ...params,
      roomId: payload.resourceType === 'room' ? payload.resourceId : undefined,
      storageId: payload.resourceType === 'storage' ? payload.resourceId : undefined,
    };

    return this.uploadFileToS3AndSaveMetadata(authenticatedParams);
  }

  async cancelUpload(roomId: string, uploadId: string) {
    await this.fileModel.findOneAndUpdate(
      { _id: roomId, 'uploadSession.uploadId': uploadId },
      { $set: { 'uploadSession.status': 'canceled' } },
    );
  }
}
