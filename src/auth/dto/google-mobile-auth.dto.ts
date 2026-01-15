import { IsString, IsOptional } from 'class-validator';

export class GoogleMobileAuthDto {
  @IsString()
  idToken: string;

  @IsOptional()
  @IsString()
  clientId?: string;
}
