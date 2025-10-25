import { Request } from 'express';
import { Profile } from 'src/modules/user/entities/profile.entity';

import { UserRole } from 'src/modules/user/entities/user.entity';

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

interface RequestWithProfile extends Request {
  user: {
    id: number;
    role: UserRole;
  };
  profile: Profile;
}

interface RefreshTokenRequest extends Request {
  refreshToken: string;
  isBrowser: boolean;
}
