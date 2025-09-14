import { IUser, JUser } from '.././auth/types/types';

import { Request } from 'express';

interface AuthRequest extends Request {
  user: IUser;
}
interface JwtAuthRequest extends Request {
  user: JUser;
}
interface RefreshTokenRequest extends Request {
  refreshToken: string;
  isBrowser: boolean;
}