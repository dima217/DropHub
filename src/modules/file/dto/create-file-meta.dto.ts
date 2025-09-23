import { IsString, IsNumber, IsOptional, IsObject, IsArray, IsIn } from 'class-validator';

export class UploadSessionDto {
  @IsString()
  uploadId: string;

  @IsIn(['in_progress', 'stopped', 'canceled', 'complete'])
  status: string;

  @IsArray()
  uploadedParts: number[];
}

export class CreateFileMetaDto {
  @IsString()
  originalName: string;

  @IsString()
  storedName: string;

  @IsNumber()
  size: number;

  @IsString()
  mimeType: string;

  @IsString()
  uploaderIp: string;

  @IsOptional()
  @IsObject()
  uploadSession?: UploadSessionDto;
}
