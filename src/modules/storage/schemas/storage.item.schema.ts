import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ collection: 'user_storage', timestamps: true })
export class UserStorageItem {
  @Prop({ type: String })
  userId: string;

  @Prop({ type: String, required: true })
  name: string; 

  @Prop({ type: Boolean, default: false })
  isDirectory: boolean;

  @Prop({ type: Types.ObjectId, ref: 'UserStorageItem', default: null })
  parentId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'SharedFile', default: null })
  fileId?: Types.ObjectId; 
}
