import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FileUploadStatus } from '../../../constants/interfaces';
import { UserStoragePermission } from '../interfaces/user.storage-request.interface';

export type UserStorageDocument = UserStorage & Document;

@Schema({ collection: 'user_storage', timestamps: true })
export class UserStorage {
  @Prop({ type: [{ type: Types.ObjectId, ref: 'SharedFile' }], default: [] })
  files: Types.ObjectId[];

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;

  @Prop({ type: Number, default: 1024 })
  maxBytes: number;

  @Prop({
    type: {
      uploadId: String,
      status: { type: String, enum: Object.values(FileUploadStatus), default: FileUploadStatus.IN_PROGRESS },
    },
    _id: false,
  })
  uploadSession: {
    uploadId?: string;
    status: FileUploadStatus;
  };

  @Prop({ type: String, enum: Object.values(UserStoragePermission), default: UserStoragePermission.PRIVATE })
  permissions: UserStoragePermission;

  @Prop({ type: String })
  userId: string;
}

export const UserStorageSchema = SchemaFactory.createForClass(UserStorage);
