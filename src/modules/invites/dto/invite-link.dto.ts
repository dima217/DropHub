import { IsOptional, IsInt, Min } from 'class-validator';

export class GenerateLinkDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  expiryDays?: number;
}
