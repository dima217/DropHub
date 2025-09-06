import { MultipartFile } from "@fastify/multipart";

export interface DeleteFileBody {
    files: string[];
}
  
  export interface GetFilesBody {
    roomId: string;
}

export interface UploadToS3Request {
    file: Express.Multer.File, 
    roomId: string, 
    uploaderIp: string, 
}