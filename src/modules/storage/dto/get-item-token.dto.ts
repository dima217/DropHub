import { IsString } from 'class-validator';

export class GetItemByTokenDto {
  @IsString()
  token: string;
}
