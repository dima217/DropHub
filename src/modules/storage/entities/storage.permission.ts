import { User } from "src/modules/user/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class StoragePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  storageId: string; 

  @ManyToOne(() => User, (user) => user.permissions, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['read', 'write', 'admin'],
    default: 'read'
  })
  role: 'read' | 'write' | 'admin';
}
