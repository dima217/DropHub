import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PersonalStoragePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storageId: string; // FK → PersonalStorage.id

  @Column()
  userId: string; // FK → User.id

  @Column({
    type: 'enum',
    enum: ['read', 'write', 'admin'],
    default: 'read'
  })
  role: 'read' | 'write' | 'admin';
}
