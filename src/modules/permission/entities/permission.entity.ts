import { User } from 'src/modules/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum AccessRole {
  ADMIN = 'admin',
  WRITE = 'write',
  READ = 'read',
}

export interface PermissionData {
  role: AccessRole;
  userId: number;
  storageId: string;
  resourceType: ResourceType;
}

export enum ResourceType {
  ROOM = 'room',
  STORAGE = 'storage',
  FILE = 'file',
  INVITE = 'invite',
}

@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  resourceId: string;

  @Column({
    type: 'enum',
    enum: ResourceType,
  })
  resourceType: ResourceType;

  @ManyToOne(() => User, (user) => user.permissions, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: AccessRole,
    default: AccessRole.READ,
  })
  role: AccessRole;
}
