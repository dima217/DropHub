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
    uploadSession: {
        uploadId: string,
        status: string
    },
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
}
export interface UserStorage {
    files: SharedFile[];
    createdAt: Date;
    permissions: string;
    maxBytes: number; 
    uploadSession: {
        uploadId: string,
        status: string
    },
}