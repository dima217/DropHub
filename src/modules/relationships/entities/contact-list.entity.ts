// src/relationships/entities/contact-list.entity.ts
import { User } from 'src/modules/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ContactListMember } from './contact-list-member.entity';
import { Profile } from 'src/modules/user/entities/profile.entity';

@Entity('contact_lists')
export class ContactList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  ownerId: number;

  @ManyToOne(() => Profile, (profile) => profile.contactList)
  @JoinColumn({ name: 'ownerId' })
  owner: Profile;

  @OneToMany(() => ContactListMember, (member) => member.list)
  members: ContactListMember[];
}
