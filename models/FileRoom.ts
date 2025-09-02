import mongoose, { Schema } from "mongoose";
import { FileRoom } from "../interfaces/files"
import { FileUploadStatus } from "constants/constants";

const fileRoomSchema = new Schema<FileRoom> ({
    files: [{type: mongoose.Schema.Types.ObjectId, ref: 'SharedFile'}],
    groups: [{type: mongoose.Schema.Types.ObjectId, ref: 'UploadSession'}],
    createdAt: {type: Date, required: true},
    expiresAt: {
        type: Date,
        default: undefined,
        index: { expires: 0 },
    },
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
    }
})

export const RoomModel = mongoose.model('Room', fileRoomSchema)