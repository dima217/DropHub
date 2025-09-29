export interface UploadToS3Request {
    file: Express.Multer.File, 
    roomId: string, 
    uploaderIp: string, 
    userId: number;
}