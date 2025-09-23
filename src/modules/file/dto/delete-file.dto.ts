import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class DeleteFileDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  files: string[];
}