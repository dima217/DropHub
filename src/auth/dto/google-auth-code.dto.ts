import { IsString } from 'class-validator';

export class GoogleAuthCodeDto {
  @IsString()
  code: string;
}
