import { IsNumber, IsString } from 'class-validator';

export class UploadToS3Dto {
    @IsString()
    originalName: string;

    @IsNumber()
    fileSize: number;

    @IsString()
    mimeType: string;

    @IsString()
    roomId: string;
    
    @IsString()
    uploaderIp?: string;
}
