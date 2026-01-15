import { IsString } from 'class-validator';

export class GoogleMobileAuthDto {
  @IsString()
  idToken: string;
}
