import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File, FileDocument } from '../schemas/file.schema';
import { Room, RoomDocument } from '../../room/schemas/room.schema';

export interface DeleteFileBody {
  files: string[];
}

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
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    return fileDoc.save();
  }

  /**
   * Marks files as expired by setting expiresAt to current date
   */
  async deleteFiles(params: DeleteFileBody) {
    const fileIds = params.files;

    const updatedFiles = await Promise.all(
      fileIds.map(async (fileId) => {
        try {
          return await this.fileModel
            .findByIdAndUpdate(
              fileId,
              { $set: { expiresAt: new Date() } },
              { new: true },
            )
            .exec();
        } catch (err) {
          console.error(`Failed to expire file ${fileId}`, err);
          return null;
        }
      }),
    );

    return updatedFiles.filter(Boolean);
  }

  /**
   * Returns non-expired files for a given room
   */
  async getFilesByRoomID(roomId: string) {
    const room = await this.roomModel
      .findById(roomId)
      .populate<{ files: FileDocument[] }>('files') 
      .exec();
  
    if (!room) {
      throw new Error("Room hasn't been found");
    }

    const validFiles = room.files.filter(file => !file.expiresAt || file.expiresAt > new Date());
  
    return validFiles;
  }

  async getFileByKey(key: string) {
    const fileDoc = await this.fileModel.findOne({ key }).lean();
    
    if (!fileDoc) {
      throw new NotFoundException(
        { error: "File doc does not exist" },
      );
    }

    return fileDoc;
  }
}


