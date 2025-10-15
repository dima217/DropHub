import { Request } from 'express';

import { UserRole } from 'src/modules/user/entities/user.entity';
import { IUser, JUser } from '.././auth/types/types';

declare module 'express' {
  export interface Request {
    userIp?: string;
  }
}
interface RequestWithUser extends Request {
  user: {
    id: number;
    role: UserRole;
  };
}
interface RefreshTokenRequest extends Request {
  refreshToken: string;
  isBrowser: boolean;
}
