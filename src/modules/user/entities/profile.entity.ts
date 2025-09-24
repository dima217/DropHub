import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsBoolean, IsEnum } from 'class-validator';

@Entity()
export class Profile {
  @ApiProperty({ description: 'Unique user identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User display password' })
  @Column()
  firstName: string;

  @ApiProperty({ description: 'User display password' })
  @Column()
  lastName: string;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column('simple-array', { nullable: true })
  personalStorageIds: string[];
}
