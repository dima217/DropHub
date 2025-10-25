import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

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

  @ManyToMany(() => Profile, (profile) => profile.contacts)
  @JoinTable()
  contacts: Profile[];
}
