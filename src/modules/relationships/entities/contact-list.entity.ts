// src/relationships/entities/contact-list.entity.ts
import { User } from 'src/modules/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ContactListMember } from './contact-list-member.entity';

@Entity('contact_lists')
export class ContactList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  ownerId: number;

  /*@ManyToOne(() => User, (user) => user.ownedContactLists)
  @JoinColumn({ name: 'ownerId' })
  owner: User;*/

  @OneToMany(() => ContactListMember, (member) => member.list)
  members: ContactListMember[];
}
