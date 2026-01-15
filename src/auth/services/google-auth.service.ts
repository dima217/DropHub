import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { DataSource } from 'typeorm';
import { User, UserRole } from 'src/modules/user/entities/user.entity';
import { UsersService } from 'src/modules/user/services/user.service';
import { TokenService } from './token.service';
import { ProfileService } from 'src/modules/user/services/profile.service';
import * as argon2 from 'argon2';

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly dataSource: DataSource,
    private readonly profileService: ProfileService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      this.logger.warn('GOOGLE_CLIENT_ID is not set. Google authentication will not work.');
    }
    this.googleClient = new OAuth2Client(clientId);
  }

  async verifyGoogleIdToken(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google ID Token');
      }

      const email = payload.email;
      const firstName = payload.given_name || '';
      const lastName = payload.family_name || '';
      const picture = payload.picture;

      if (!email) {
        throw new BadRequestException('Email not provided in Google token');
      }

      const existingUser = await this.usersService.findByEmail(email);
      let user: User;

      if (!existingUser) {
        user = await this.createUserWithProfile({
          email,
          firstName,
          lastName,
          picture,
          role: UserRole.USER,
          isOAuthUser: true,
        });
      } else {
        const fullUser = await this.usersService.getUserById(existingUser.id);
        if (!fullUser) {
          throw new UnauthorizedException('User not found');
        }

        if (!fullUser.isOAuthUser) {
          await this.dataSource.getRepository(User).update(fullUser.id, { isOAuthUser: true });
        }

        user = fullUser;
      }

      const accessToken = this.tokenService.generateAccessToken(user.id);
      const refreshToken = this.tokenService.generateRefreshToken(user.id);
      await this.usersService.updateRefreshToken(user.id, refreshToken);

      const userWithProfile = await this.dataSource.getRepository(User).findOne({
        where: { id: user.id },
        relations: ['profile'],
      });

      return {
        accessToken,
        refreshToken,
        user: userWithProfile?.profile ? { profile: userWithProfile.profile } : undefined,
      };
    } catch (error) {
      this.logger.error('Error verifying Google ID Token', error);
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to verify Google ID Token');
    }
  }

  private async createUserWithProfile(params: {
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
    role: UserRole;
    isOAuthUser: boolean;
  }): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const profile = await this.profileService.createProfileTransactional(
        {
          firstName: params.firstName,
          lastName: params.lastName,
          avatarUrl: params.picture || null,
        },
        manager,
      );

      const user = await this.usersService.createUserTransactional(
        {
          email: params.email,
          password: undefined,
          role: params.role,
          isOAuthUser: params.isOAuthUser,
          profile,
        },
        manager,
      );

      profile.user = user;
      await manager.save(profile);
      return user;
    });
  }
}
