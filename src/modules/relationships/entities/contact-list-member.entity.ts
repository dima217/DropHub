// src/relationships/entities/contact-list-member.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ContactList } from './contact-list.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Entity('contact_list_members')
@Index(['listId', 'userId'], { unique: true })
export class ContactListMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  listId: number;

  @Column()
  userId: number;

  @ManyToOne(() => ContactList, (list) => list.members)
  @JoinColumn({ name: 'listId' })
  list: ContactList;

  /* @ManyToOne(() => User, (user) => user.contactListMemberships)
  @JoinColumn({ name: 'userId' })
  member: User; */
}
