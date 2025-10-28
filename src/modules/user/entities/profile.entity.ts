import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { ContactList } from 'src/modules/relationships/entities/contact-list.entity';
import { ContactListMember } from 'src/modules/relationships/entities/contact-list-member.entity';

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

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  user: User;

  @OneToMany(() => ContactList, (list) => list.owner)
  @JoinColumn()
  contactList: ContactList[];

  @OneToMany(() => ContactListMember, (member) => member.member)
  memberOfLists: ContactListMember[];
}
