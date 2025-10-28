// src/relationships/entities/contact-list-member.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ContactList } from './contact-list.entity';
import { Profile } from 'src/modules/user/entities/profile.entity';

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

  @ManyToOne(() => Profile, (profile) => profile.id)
  @JoinColumn({ name: 'profileId' })
  member: Profile;
}
