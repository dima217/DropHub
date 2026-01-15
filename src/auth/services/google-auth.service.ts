import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { DataSource } from 'typeorm';
import { User, UserRole } from 'src/modules/user/entities/user.entity';
import { UsersService } from 'src/modules/user/services/user.service';
import { TokenService } from './token.service';
import { ProfileService } from 'src/modules/user/services/profile.service';

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private readonly idTokenClient: OAuth2Client;
  private readonly webAuthClient: OAuth2Client;
  private readonly googleDriveClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly dataSource: DataSource,
    private readonly profileService: ProfileService,
  ) {
    const webClientId = this.configService.get<string>('GOOGLE_WEB_CLIENT_ID');
    const webClientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const androidClientId = this.configService.get<string>('GOOGLE_ANDROID_CLIENT_ID');

    if (!webClientId || !webClientSecret) {
      this.logger.error(
        'GOOGLE_WEB_CLIENT_ID and GOOGLE_CLIENT_SECRET are required for Google authentication',
      );
    }

    this.idTokenClient = new OAuth2Client();

    this.webAuthClient = new OAuth2Client(
      webClientId,
      webClientSecret,
      this.configService.get<string>('GOOGLE_CALLBACK_URL'),
    );

    this.googleDriveClient = new OAuth2Client(webClientId, webClientSecret);
  }

  async verifyGoogleIdToken(idToken: string, clientId?: string) {
    try {
      const ticket = await this.idTokenClient.verifyIdToken({
        idToken,
        audience: clientId || this.configService.get<string>('GOOGLE_ANDROID_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google ID Token');
      }

      const email = payload.email;
      const firstName = payload.given_name || '';
      const lastName = payload.family_name || '';
      const picture = payload.picture;
      const googleUserId = payload.sub;

      if (!email) {
        throw new BadRequestException('Email not provided in Google token');
      }

      const user = await this.findOrCreateUser({
        email,
        firstName,
        lastName,
        picture,
        googleUserId,
      });

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
        requiresOAuthForGoogleApis: !user.googleRefreshToken,
      };
    } catch (error) {
      this.logger.error('Error verifying Google ID Token', error);
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to verify Google ID Token');
    }
  }

  async exchangeAuthorizationCode(
    code: string,
    redirectUri?: string,
  ): Promise<{
    googleAccessToken: string;
    googleRefreshToken: string | null;
    idToken?: string;
    userInfo: any;
  }> {
    try {
      const { tokens } = await this.webAuthClient.getToken({
        code,
        redirect_uri: redirectUri || this.configService.get<string>('GOOGLE_CALLBACK_URL'),
      });

      if (!tokens.access_token) {
        throw new UnauthorizedException('Failed to get access token from Google');
      }

      let userInfo: any = null;
      if (tokens.id_token) {
        const ticket = await this.idTokenClient.verifyIdToken({
          idToken: tokens.id_token,
          audience: this.configService.get<string>('GOOGLE_WEB_CLIENT_ID'),
        });
        userInfo = ticket.getPayload() || null;
      }

      if (!userInfo && tokens.access_token) {
        userInfo = await this.getUserInfo(tokens.access_token);
      }

      return {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || null,
        idToken: tokens.id_token || undefined,
        userInfo,
      };
    } catch (error) {
      this.logger.error('Error exchanging authorization code', error);
      if ((error as any).response?.data) {
        this.logger.error('Google API error:', (error as any).response.data);
      }
      throw new UnauthorizedException('Failed to exchange authorization code');
    }
  }

  async handleGoogleAuthCode(code: string, redirectUri?: string) {
    const { googleAccessToken, googleRefreshToken, userInfo } =
      await this.exchangeAuthorizationCode(code, redirectUri);

    if (!userInfo?.email) {
      throw new BadRequestException('Email not provided by Google');
    }

    const email = userInfo.email;
    const firstName = userInfo.given_name || '';
    const lastName = userInfo.family_name || '';
    const picture = userInfo.picture;
    const googleUserId = userInfo.sub || '';

    const user = await this.findOrCreateUser({
      email,
      firstName,
      lastName,
      picture,
      googleUserId,
      googleAccessToken,
      googleRefreshToken,
    });

    await this.updateGoogleTokens(user.id, googleAccessToken, googleRefreshToken);

    const jwtAccessToken = this.tokenService.generateAccessToken(user.id);
    const jwtRefreshToken = this.tokenService.generateRefreshToken(user.id);
    await this.usersService.updateRefreshToken(user.id, jwtRefreshToken);

    const userWithProfile = await this.dataSource.getRepository(User).findOne({
      where: { id: user.id },
      relations: ['profile'],
    });

    return {
      accessToken: jwtAccessToken,
      refreshToken: jwtRefreshToken,
      googleAccessToken,
      googleRefreshToken,
      user: userWithProfile?.profile ? { profile: userWithProfile.profile } : undefined,
    };
  }

  private async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Error getting user info from Google', error);
      return null;
    }
  }

  private async findOrCreateUser(params: {
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
    googleUserId: string;
    googleAccessToken?: string;
    googleRefreshToken?: string | null;
  }): Promise<User> {
    let user = await this.dataSource.getRepository(User).findOne({
      where: { googleUserId: params.googleUserId },
      relations: ['profile'],
    });

    if (!user) {
      const existingUser = await this.usersService.findByEmail(params.email);
      if (existingUser) {
        user = await this.dataSource.getRepository(User).findOne({
          where: { id: existingUser.id },
          relations: ['profile'],
        });
      }
    }

    if (user) {
      if (!user.googleUserId) {
        await this.dataSource.getRepository(User).update(user.id, {
          googleUserId: params.googleUserId,
          isOAuthUser: true,
        });
      }

      if (params.googleAccessToken || params.googleRefreshToken) {
        await this.updateGoogleTokens(user.id, params.googleAccessToken, params.googleRefreshToken);
      }

      return user;
    }

    return this.createUserWithProfile({
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      picture: params.picture,
      role: UserRole.USER,
      googleUserId: params.googleUserId,
      googleAccessToken: params.googleAccessToken,
      googleRefreshToken: params.googleRefreshToken,
    });
  }

  private async createUserWithProfile(params: {
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
    role: UserRole;
    googleUserId: string;
    googleAccessToken?: string;
    googleRefreshToken?: string | null;
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
          isOAuthUser: true,
          profile,
          googleUserId: params.googleUserId,
          googleAccessToken: params.googleAccessToken || null,
          googleRefreshToken: params.googleRefreshToken || null,
        },
        manager,
      );

      profile.user = user;
      await manager.save(profile);

      return user;
    });
  }

  private async updateGoogleTokens(
    userId: number,
    googleAccessToken?: string,
    googleRefreshToken?: string | null,
  ): Promise<void> {
    const updateData: Partial<User> = {};

    if (googleAccessToken !== undefined) {
      updateData.googleAccessToken = googleAccessToken;
    }

    if (googleRefreshToken !== undefined) {
      updateData.googleRefreshToken = googleRefreshToken;
    }

    await this.dataSource.getRepository(User).update(userId, updateData);
  }

  async refreshGoogleAccessToken(userId: number): Promise<string | null> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      select: ['googleAccessToken', 'googleRefreshToken'],
    });

    if (!user?.googleRefreshToken) {
      this.logger.warn(`No Google refresh token found for user ${userId}`);
      return null;
    }

    try {
      this.googleDriveClient.setCredentials({
        refresh_token: user.googleRefreshToken,
      });

      const { credentials } = await this.googleDriveClient.refreshAccessToken();
      const newAccessToken = credentials.access_token;

      if (newAccessToken) {
        await this.dataSource.getRepository(User).update(userId, {
          googleAccessToken: newAccessToken,
        });
        this.logger.log(`Google access token refreshed for user ${userId}`);
        return newAccessToken;
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to refresh Google access token for user ${userId}`, error);

      if ((error as any).message?.includes('invalid_grant')) {
        await this.dataSource.getRepository(User).update(userId, {
          googleRefreshToken: null,
          googleAccessToken: null,
        });
      }

      return null;
    }
  }

  async getValidGoogleAccessToken(userId: number): Promise<string | null> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      select: ['googleAccessToken', 'googleRefreshToken'],
    });

    if (!user?.googleAccessToken) {
      return null;
    }

    if (!user.googleRefreshToken) {
      return user.googleAccessToken;
    }

    try {
      this.googleDriveClient.setCredentials({
        access_token: user.googleAccessToken,
      });

      await this.googleDriveClient.getTokenInfo(user.googleAccessToken);

      return user.googleAccessToken;
    } catch (error) {
      this.logger.warn(`Google access token expired for user ${userId}, attempting refresh`);
      return this.refreshGoogleAccessToken(userId);
    }
  }

  async revokeGoogleTokens(userId: number): Promise<void> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      select: ['googleAccessToken'],
    });

    if (user?.googleAccessToken) {
      try {
        await this.webAuthClient.revokeToken(user.googleAccessToken);
      } catch (error) {
        this.logger.warn(`Failed to revoke Google token for user ${userId}`, error);
      }
    }

    await this.dataSource.getRepository(User).update(userId, {
      googleAccessToken: null,
      googleRefreshToken: null,
    });
  }

  getOAuthUrl(redirectUri?: string): string {
    const url = this.webAuthClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
      prompt: 'consent',
      redirect_uri: redirectUri || this.configService.get<string>('GOOGLE_CALLBACK_URL'),
    });

    return url;
  }
}
