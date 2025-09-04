import { User } from '../entities/user.entity';

export interface CreateUserResponse {
  user: User;
  token: string;
}
