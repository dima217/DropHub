import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ description: 'User full name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'User full name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'User full name' })
  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ description: 'User full password' })
  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsBoolean()
  @IsOptional()
  isOAuthUser: boolean;
}
