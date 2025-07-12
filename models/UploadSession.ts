import mongoose, { Schema } from "mongoose";
import { UploadSession } from "../interfaces/files"

const uploadSessionSchema = new Schema<UploadSession> ({
    files: [{type: mongoose.Schema.Types.ObjectId, ref: 'SharedFile'}],
    createdAt: {type: Date, required: true},
    expiresAt: {
        type: Date,
        default: new Date(Date.now() + 1000 * 60 * 60 * 24),
        index: { expires: 0 }
    }
})