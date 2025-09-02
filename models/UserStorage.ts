import mongoose, { Schema } from "mongoose";
import { FileUploadStatus, UserStoragePermission } from "constants/constants";
import { UserStorage } from "interfaces/files";

const userStorageSchema = new Schema<UserStorage> ({
    files: [{type: mongoose.Schema.Types.ObjectId, ref: 'SharedFile'}],
    createdAt: {type: Date, required: true},
    maxBytes: {
        type: Number,
        default: 1024,
    },
    uploadSession: {
        uploadId: {type: String},
        status: {
            type: String,
            enum: Object.values(FileUploadStatus),
            default: "in_progress",
        },
    },
    permissions: {
        type: String,
        enum: Object.values(UserStoragePermission),
        default: "private"
    }
})

export const RoomModel = mongoose.model('Room', userStorageSchema)