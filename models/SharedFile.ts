import mongoose, { Schema } from "mongoose";
import { SharedFile } from "../interfaces/files"

const sharedFileSchema = new Schema<SharedFile> ({
    originalName: {type: String, required: true},
    storedName: {type: String, unique: true, required: true},
    size: {type: Number, required: true},
    mimeType: {type: String, required: true},
    uploadTime: {type: Date, required: true},
    downloadCount: {type: Number, required: true},
    uploaderIp: String,
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 1000 * 60 * 60 * 6),
        index: { expires: 0 }, 
    },
})

const FileModel = mongoose.model("File", sharedFileSchema)

export default FileModel;