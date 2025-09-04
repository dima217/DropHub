import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUser } from '../types/types';
import { UsersService } from '../../modules/user/services/user.service';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly cacheService: CacheService
  ) {
    const secretOrKey = configService.get<string>('JWT_SECRET');
    if (!secretOrKey) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretOrKey,
    });
  }

  async validate(user: IUser) {
    const cacheKey = `user:${user.id}`

    const fullUser = await this.cacheService.cacheWrapper(cacheKey, async () => {
      return await this.usersService.getUserById(user.id);
    });
    
    if (fullUser?.isBanned === true) {
      throw new UnauthorizedException('Your account has been banned.');
    }

    return {id: user.id, email: user.email, username: fullUser?.username, balance: fullUser?.balance, role: fullUser?.role, avatarUrl: fullUser?.avatarUrl };
  }
}
