import { IsNumber } from 'class-validator';

export class Contact {
  @IsNumber()
  contactId: number;
}
