import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File, FileDocument } from '../schemas/file.schema';
import { Room, RoomDocument } from '../../room/schemas/room.schema';
import { CreateFileMetaDto } from '../dto/create-file-meta.dto';
import { DeleteFileDto } from '../dto/delete-file.dto';
import { GetFilesDto } from '../dto/get-files.dto';
import { FileUploadStatus } from 'src/constants/interfaces';

@Injectable()
export class FilesService {
  constructor(
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
    if (!dto.files || dto.files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const updatedFiles = await Promise.all(dto.files.map((fileId) => this.expireFile(fileId)));

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

  async getFilesByRoomID(dto: GetFilesDto) {
    if (!dto.roomId) {
      throw new BadRequestException('No roomId provided');
    }

    const room = await this.roomModel
      .findById(dto.roomId)
      .populate<{ files: FileDocument[] }>('files')
      .exec();

    if (!room) {
      throw new NotFoundException("Room hasn't been found");
    }

    const validFiles = room.files.filter((file) => !file.expiresAt || file.expiresAt > new Date());

    return validFiles;
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
