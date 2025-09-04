// update-balance.dto.ts
import { IsNumber } from 'class-validator';

export class UpdateBalanceDto {
  @IsNumber()
  balance: number;
}
