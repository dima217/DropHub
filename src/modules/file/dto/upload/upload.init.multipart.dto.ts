import { IsString, IsNumber, Min } from 'class-validator';

export class UploadInitMultipartDto {
  @IsString()
  fileName: string;

  @IsNumber()
  @Min(1)
  totalParts: number;
}
