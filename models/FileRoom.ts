import mongoose, { Schema } from "mongoose";
import { FileRoom } from "../interfaces/files"

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
    }
})

export const RoomModel = mongoose.model('Room', fileRoomSchema)