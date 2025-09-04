import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User full name' })
  @IsString()
  username: string;

  @ApiProperty({ description: 'User full name' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User full password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Account balance value' })
  @IsNumber()
  @Min(0)
  balance: number;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
