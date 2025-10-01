import { IUser, JUser } from '.././auth/types/types';

import { Request } from 'express';

declare module 'express' {
    export interface Request {
      userIp?: string;
    }
}

interface AuthRequest extends Request {
  user: IUser;
}
interface JwtAuthRequest extends Request {
  user: JUser;
}
interface RequestWithUser extends Request {
  user: number; 
}
interface RefreshTokenRequest extends Request {
  refreshToken: string;
  isBrowser: boolean;
}