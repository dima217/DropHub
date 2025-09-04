import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsBoolean, IsEnum, IsNumber, Min } from 'class-validator';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
@Entity()
export class User {
  @ApiProperty({ description: 'Unique user identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User display name' })
  @Column()
  username: string;

  @ApiProperty({ description: 'User display email' })
  @Column()
  email: string;

  @ApiProperty({ description: 'User display password' })
  @Column()
  password: string;

  @ApiProperty({ description: 'Current account balance' })
  @Column()
  @IsNumber()
  @Min(0)
  balance: number;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({
    description: 'Is user banned',
    example: false,
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isBanned: boolean;

  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiredDate: Date | null;
}
