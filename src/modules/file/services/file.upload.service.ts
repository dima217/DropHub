import { BadGatewayException, BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { S3WriteStream } from '../utils/s3-write-stream';
import { File, FileDocument } from '../schemas/file.schema';
import { Room, RoomDocument } from '../../room/schemas/room.schema';
import { MAX_UPLOAD_SIZE, UPLOAD_STRATEGY } from '../../../constants/interfaces';
import { S3Service } from 'src/s3/s3.service';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { UploadCompleteDto } from '../dto/upload/upload.complete.dto';
import { UploadToS3Request } from '../interfaces/file-request.interface';
import { UploadInitMultipartDto } from '../dto/upload/upload.init.multipart.dto';
import { FilesService } from './file.service';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class FileUploadService {
  private readonly bucket: string;

  constructor(
    private readonly s3Service: S3Service,
    private readonly s3Stream: S3WriteStream,
    private readonly fileService: FilesService,
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) {
    this.bucket = process.env.AWS_S3_BUCKET ?? '';
    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET is not set');
    }
  }

  async uploadFileToS3AndSaveMetadata(params: UploadToS3Request) {
    const { file, roomId, uploaderIp, userId } = params;

    if (!file || !roomId) {
      throw new BadRequestException(
        { error: "Missing 'file' or 'roomId'" },
      );
    }

    const fileKey = `${roomId}/${randomUUID()}-${file.originalname}`;
    const fileBuffer = file.buffer;

    await this.s3Service.uploadFile({
        Bucket: this.bucket,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: file.mimetype,
    });

    const fileUploadMeta = await this.fileService.createFileMeta({
      originalName: file.originalname,
      storedName: fileKey,
      size: fileBuffer.length,
      mimeType: file.mimetype,
      uploaderIp,
    });

    await this.roomModel.findByIdAndUpdate(roomId, {
      $push: { files: fileUploadMeta._id },
    });

    this.rabbitClient.emit('storage.item.created', {
      storageId: roomId,
      fileId: fileUploadMeta._id,
      userId,
    });
  }

  async initUploading(fileSize: number) {
    if (!fileSize) {
      throw new BadRequestException('Filesize is undefined')
    } 
    if (fileSize > 0) {
      return fileSize >= MAX_UPLOAD_SIZE ? UPLOAD_STRATEGY.MULTIPART : UPLOAD_STRATEGY.SINGLE;
    }
    return null;
  }

  async initUploadMultipart(params: UploadInitMultipartDto, ip: string) {
    const init = await this.s3Stream.initMultipart(params.fileName, params.totalParts);
    if (!init) {
      throw new BadGatewayException(
        { error: "Init multipart failed" },
      );
    }
    const fileUploadMeta = await this.fileService.createFileMeta({
      originalName: params.fileName,
      storedName: params.key,
      size: params.fileSize,
      mimeType: params.fileType,
      uploaderIp: ip,
      uploadSession: {
        uploadId: init.uploadId,    
        status: 'in_progress',
        uploadedParts: [],
      },
    });

    return { uploadId: init.uploadId, key: init.key, fileId: fileUploadMeta._id };
  }

  async completeMultipart(
    params: UploadCompleteDto,
  ) {
    await this.s3Stream.completeMultipart(params.key, params.uploadId, params.parts);

    const file = await this.fileService.getFileByKey(params.key);

    await this.roomModel.findByIdAndUpdate(params.roomId, {
      $push: { files: file._id },
      $set: { 'uploadSession.status': 'complete' },
    });
  }

  async cancelUpload(roomId: string, uploadId: string) { // cancel uploading
    await this.fileModel.findOneAndUpdate(
      { _id: roomId, 'uploadSession.uploadId': uploadId },
      { $set: { 'uploadSession.status': 'canceled' } },
    );
  }

  async stopUpload(  // stop uploading
    roomId: string, 
    uploadId: string, 
    uploadedParts: number[],
  ) { 
    await this.fileModel.findOneAndUpdate(
      { _id: roomId, 'uploadSession.uploadId': uploadId },
      { $set: { 
        'uploadSession.status': 'stopped',
        'uploadSession.uploadedParts': uploadedParts, 
      } },
    );
  }
}
