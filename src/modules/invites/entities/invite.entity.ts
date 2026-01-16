// src/invites/entities/invite.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum InviteStatus {
  PENDING = 'PENDING',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

@Entity('invites')
export class Invite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  senderId: number;

  @Column({ nullable: true })
  targetEmail: string;

  @Column({ unique: true })
  token: string;

  @Column({
    type: 'enum',
    enum: InviteStatus,
    default: InviteStatus.PENDING,
  })
  status: InviteStatus;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
