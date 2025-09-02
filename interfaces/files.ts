import { Types } from "mongoose";
export interface SharedFile {
    _id: Types.ObjectId;
    originalName: string;
    storedName: string;
    size: number;
    mimeType: string;
    uploadTime: Date;
    downloadCount: number;
    uploaderIp?: string;
    expiresAt?: Date;   
}

export interface UploadSession {
    _id: Types.ObjectId;
    files: SharedFile[];
    createdAt: Date;
    expiresAt?: Date;
}

export interface FileRoom {
    files: SharedFile[];
    groups: UploadSession[];
    createdAt: Date;
    expiresAt?: Date; 
    maxBytes: number; 
    uploadSession: {
        uploadId: string,
        status: string
    },
}