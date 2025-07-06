interface SharedFile {
    id: string;
    originalName: string;
    storedName: string;
    size: number;
    mimeType: string;
    uploadTime: Date;
    downloadCount: number;
    uploaderIp?: string;
    expiresAt?: Date;   
}

interface UploadSession {
    id: string;
    files: string[];
    createdAt: Date;
    expiresAt?: Date;
}

interface FileRoom {
    id: string;
    files: string[];
    createdAt: Date;
    expiresAt?: Date; 
    maxBytes: number; 
}