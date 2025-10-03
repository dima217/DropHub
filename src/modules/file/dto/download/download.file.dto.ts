import { IsString } from 'class-validator';

export class DownloadFileDto {
  @IsString()
  uploadId: string;
}
