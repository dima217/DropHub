import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsBoolean, IsEnum } from 'class-validator';
import { Profile } from './profile.entity';
import { PersonalStoragePermission } from 'src/modules/storage/entities/storage.permission';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
@Entity()
export class User {
  @ApiProperty({ description: 'Unique user identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User display email' })
  @Column()
  email: string;

  @ApiProperty({ description: 'User display password' })
  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Is user banned',
    example: false,
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isBanned: boolean;

  @Column({ default: null, nullable: true })
  refreshToken: string | null;

  @Column({ default: 0 })
  tokenVersion: number;

  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiredDate: Date | null;

  @IsBoolean()
  isOAuthUser: boolean;

  @OneToOne(() => Profile, { cascade: true })
  @JoinColumn()
  profile: Profile;

  @OneToMany(() => PersonalStoragePermission, (perm) => perm.user, { cascade: true })
  @JoinColumn()
  permissions: PersonalStoragePermission;
}
