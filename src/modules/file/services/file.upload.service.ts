import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { S3WriteStream } from '../utils/s3-write-stream';
import { File, FileDocument } from '../schemas/file.schema';
import { Room, RoomDocument } from '../../room/schemas/room.schema';
import { FileUploadStatus, MAX_UPLOAD_SIZE, UPLOAD_STRATEGY } from '../../../constants/interfaces';
import { S3Service } from 'src/s3/s3.service';
import { UploadCompleteDto } from '../dto/upload/upload.complete.dto';
import { UploadData } from '../interfaces/file-request.interface';
import { UploadInitMultipartDto } from '../dto/upload/upload.init.multipart.dto';
import { FilesService } from './file.service';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_BUCKET_TOKEN } from 'src/s3/s3.tokens';
import { StorageService } from 'src/modules/storage/services/user.storage.service';
import { TokenService } from 'src/modules/token/services/token.service';

@Injectable()
export class FileUploadService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly storageService: StorageService,
    private readonly s3Stream: S3WriteStream,
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

  private async bindFileToRoom(roomId: string, fileId: string) {
    await this.roomModel.findByIdAndUpdate(roomId, {
      $push: { files: fileId },
    });
  }

  private async bindFileToStorage(storageId: string, userId: number) {
    await this.storageService.createItemInStorage(storageId, userId);
  }

  async uploadFileToS3AndSaveMetadata(params: UploadData) {
    const { fileSize, mimeType, roomId, uploaderIp, originalName, storageId, userId } = params;
    const uploadId = randomUUID();

    if (!fileSize || !roomId) {
      throw new BadRequestException({ error: "Missing 'file' or 'roomId'" });
    }

    const { url, key } = await this.getPresignedUrl(originalName, mimeType);

    const fileUploadMeta = await this.fileService.createFileMeta({
      originalName: originalName,
      key: key,
      size: fileSize,
      mimeType: mimeType,
      uploaderIp,
      uploadSession: {
        uploadId: uploadId,
        status: FileUploadStatus.IN_PROGRESS,
      },
    });

    if (roomId) {
      await this.bindFileToRoom(roomId, fileUploadMeta._id as string);
    }

    if (storageId && userId) {
      await this.bindFileToStorage(storageId, userId);
    }

    return { url, uploadId };
  }

  async uploadFileByToken(params: UploadData) {
    const { uploadToken } = params;

    const payload = await this.tokenService.validateToken(uploadToken!);

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

  // MULTIPART DEMO:

  async initUploading(fileSize: number) {
    if (!fileSize) {
      throw new BadRequestException('Filesize is undefined');
    }
    if (fileSize > 0) {
      return fileSize >= MAX_UPLOAD_SIZE ? UPLOAD_STRATEGY.MULTIPART : UPLOAD_STRATEGY.SINGLE;
    }
    return null;
  }

  async initUploadMultipart(params: UploadInitMultipartDto, ip: string) {
    const init = await this.s3Stream.initMultipart(params.fileName, params.totalParts);
    if (!init) {
      throw new BadGatewayException({ error: 'Init multipart failed' });
    }
    const fileUploadMeta = await this.fileService.createFileMeta({
      originalName: params.fileName,
      key: params.key,
      size: params.fileSize,
      mimeType: params.fileType,
      uploaderIp: ip,
      uploadSession: {
        uploadId: init.uploadId,
        status: FileUploadStatus.IN_PROGRESS,
        uploadedParts: [],
      },
    });

    return { uploadId: init.uploadId, key: init.key, fileId: fileUploadMeta._id };
  }

  async completeMultipart(params: UploadCompleteDto) {
    const file = await this.fileService.getFileByUploadId(params.uploadId);

    await this.s3Stream.completeMultipart(file.key, params.uploadId, params.parts);

    await this.roomModel.findByIdAndUpdate(params.roomId, {
      $push: { files: file._id },
      $set: { 'uploadSession.status': 'complete' },
    });
  }

  async stopUpload(roomId: string, uploadId: string, uploadedParts: number[]) {
    await this.fileModel.findOneAndUpdate(
      { _id: roomId, 'uploadSession.uploadId': uploadId },
      {
        $set: {
          'uploadSession.status': 'stopped',
          'uploadSession.uploadedParts': uploadedParts,
        },
      },
    );
  }
}
