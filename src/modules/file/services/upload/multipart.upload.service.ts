// src/file/services/multipart.upload.service.ts

import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { S3WriteStream } from '../../utils/s3-write-stream';
import { File, FileDocument } from '../../schemas/file.schema';
import { Room, RoomDocument } from '../../../room/schemas/room.schema';
import { FileUploadStatus } from '../../../../constants/interfaces';
import { UploadCompleteDto } from '../../dto/upload/upload-complete.dto';
import { UploadInitMultipartDto } from '../../dto/upload/upload-init-multipart.dto';
import { FilesService } from '../file.service';

@Injectable()
export class MultipartUploadService {
  constructor(
    private readonly s3Stream: S3WriteStream,
    private readonly fileService: FilesService,
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
  ) {}

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
      $set: { 'uploadSession.status': FileUploadStatus.COMPLETE },
    });
  }

  async stopUpload(roomId: string, uploadId: string, uploadedParts: number[]) {
    await this.fileModel.findOneAndUpdate(
      { _id: roomId, 'uploadSession.uploadId': uploadId },
      {
        $set: {
          'uploadSession.status': FileUploadStatus.STOPPED,
          'uploadSession.uploadedParts': uploadedParts,
        },
      },
    );
  }
}
