export interface UploadData {
    originalName: string,
    fileSize: number, 
    mimeType: string,
    roomId: string, 
    uploaderIp?: string,
}