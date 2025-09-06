import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { S3WriteStream } from '../utils/s3-write-stream';
import { File, FileDocument } from '../schemas/file.schema';
import { Room, RoomDocument } from '../../room/schemas/room.schema';
import { MAX_UPLOAD_SIZE, UPLOAD_STRATEGY } from '../../../constants/interfaces';
import { S3Service } from 'src/s3/s3.service';
import { CompletedPart, PutObjectCommand } from '@aws-sdk/client-s3';
import { UploadComplete, UploadToS3Request } from '../interfaces/file-request.interface';

@Injectable()
export class FileUploadService {
  private readonly bucket: string;

  constructor(
    private readonly s3Service: S3Service,
    private readonly s3Stream: S3WriteStream,
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
  ) {
    this.bucket = process.env.AWS_S3_BUCKET ?? '';
    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET is not set');
    }
  }

  private get s3Client() {
    return this.s3Service.getClient();
  }

  async uploadFileToS3AndSaveMetadata(params: UploadToS3Request) {
    const { file, roomId, uploaderIp } = params;

    const fileKey = `${roomId}/${randomUUID()}-${file.originalname}`;
    const fileBuffer = file.buffer;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: file.mimetype,
      }),
    );

    const fileUploadMeta = new this.fileModel({
      originalName: file.originalname,
      storedName: fileKey,
      size: fileBuffer.length,
      mimeType: file.mimetype,
      uploadTime: new Date(),
      downloadCount: 0,
      uploaderIp,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24ч
    });

    await this.roomModel.findByIdAndUpdate(roomId, {
      $push: { files: fileUploadMeta._id },
    });

    await fileUploadMeta.save();
  }

  async initUploading(fileSize: number) {
    if (fileSize >= MAX_UPLOAD_SIZE) return UPLOAD_STRATEGY.MULTIPART;
    if (fileSize <= MAX_UPLOAD_SIZE) return UPLOAD_STRATEGY.SINGLE;
    return null;
  }

  async initUploadMultipart(fileName: string, totalParts: number) {
    return this.s3Stream.initMultipart(fileName, totalParts);
  }

  async completeMultipart(
    params: UploadComplete,
    ip: string,
  ) {
    await this.s3Stream.completeMultipart(params.key, params.uploadId, params.parts);

    const fileUploadMeta = new this.fileModel({
      originalName: params.fileName,
      storedName: params.key,
      size: params.fileSize,
      mimeType: params.fileType,
      uploadTime: new Date(),
      downloadCount: 0,
      uploaderIp: ip,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await this.roomModel.findByIdAndUpdate(params.roomId, {
      $push: { files: fileUploadMeta._id },
      $set: { 'uploadSession.status': 'complete' },
    });

    await fileUploadMeta.save();
  }

  async cancelUpload(roomId: string, uploadId: string) { // cancel uploading
    await this.roomModel.findOneAndUpdate(
      { _id: roomId, 'uploadSession.uploadId': uploadId },
      { $set: { 'uploadSession.status': 'canceled' } },
    );
  }

  async stopUpload(roomId: string, uploadId: string) {  // stop uploading
    await this.roomModel.findOneAndUpdate(
      { _id: roomId, 'uploadSession.uploadId': uploadId },
      { $set: { 'uploadSession.status': 'stopped' } },
    );
  }
}
