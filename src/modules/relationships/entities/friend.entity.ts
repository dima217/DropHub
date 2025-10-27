import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('friends')
@Index(['userOneId', 'userTwoId'], { unique: true })
export class Friend {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userOneId: number;

  @Column()
  userTwoId: number;
}
