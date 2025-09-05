import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import Document from 'mongoose';
import { SharedFile } from '../../../constants/schemas';
import { FileUploadStatus } from 'src/constants/interfaces';

export type FileDocument = SharedFile & Document;

@Schema({ timestamps: true })
export class File {
  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true, unique: true })
  storedName: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  uploadTime: Date;

  @Prop({ required: true, default: 0 })
  downloadCount: number;

  @Prop()
  uploaderIp?: string;

  @Prop({
    default: () => new Date(Date.now() + 1000 * 60 * 60 * 6),
  })
  expiresAt: Date;

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

export const FileSchema = SchemaFactory.createForClass(File);
