import { User } from "src/modules/user/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { StorageRole } from "../interfaces/user.storage-request.interface";

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
    enum: StorageRole,
    default: 'read'
  })
  role: StorageRole;
}
