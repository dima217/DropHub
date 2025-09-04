import { UserRole } from 'src/modules/user/entities/user.entity';

export interface IUser {
  id: number;
  email: string;
  role: UserRole;
}

export interface JUser {
  id: number;
  username: string;
  balance: number;
  role: UserRole;
  avatarUrl?: string | null;
}
