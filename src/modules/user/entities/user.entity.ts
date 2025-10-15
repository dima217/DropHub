import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IsBoolean, IsEnum } from 'class-validator';
import { Profile } from './profile.entity';
import { StoragePermission } from 'src/modules/permission/entities/permission.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
@Entity()
export class User {
  @ApiProperty({ description: 'Unique user identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', default: () => 'uuid_generate_v4()' })
  uuid: string;

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

  @OneToMany(() => StoragePermission, (perm) => perm, { cascade: true })
  @JoinColumn()
  permissions: StoragePermission;
}
