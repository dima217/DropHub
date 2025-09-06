import { MultipartFile } from "@fastify/multipart";

export interface DeleteFileBody {
    files: string[];
}
  
  export interface GetFilesBody {
    roomId: string;
}

export interface downloadInterface {
    key: string, 
}

export interface UploadInitRequestBody {
    fileSize: number;
}

export interface UploadInitMultipart {
    fileName: string;
    totalParts: number;
}

export interface UploadComplete {
    uploadId: string;
    key: string;
    parts: { ETag: string; PartNumber: number }[]; 
    roomId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
}

export interface UploadToS3Request {
    file: Express.Multer.File,
    roomId: string,
    uploaderIp: string,
}