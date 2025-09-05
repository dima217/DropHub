import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FileUploadStatus } from '../../../constants/interfaces';

export type FileRoomDocument = FileRoom & Document;

@Schema({ timestamps: true })
export class FileRoom {
  @Prop({ type: [{ type: Types.ObjectId, ref: 'SharedFile' }], default: [] })
  files: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'UploadSession' }], default: [] })
  groups: Types.ObjectId[];

  @Prop({ required: true, default: () => new Date() })
  createdAt: Date;

  @Prop({
    type: Date,
    default: undefined,
    index: { expires: 0 },
  })
  expiresAt?: Date;

  @Prop({ default: 1024 })
  maxBytes: number;

  @Prop({
    type: Object,
    default: () => ({
      uploadId: undefined,
      status: FileUploadStatus.IN_PROGRESS,
    }),
  })
  uploadSession: {
    uploadId?: string;
    status: FileUploadStatus;
  };
}

export const RoomSchema = SchemaFactory.createForClass(FileRoom);
