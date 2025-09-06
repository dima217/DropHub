import { IsString } from 'class-validator';

export class UploadToS3Dto {
  @IsString()
  roomId: string;

  @IsString()
  uploaderIp: string;
}
