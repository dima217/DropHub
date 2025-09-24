import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthPayloadDto } from '../dto/auth.dto';
import { UsersService } from '../../modules/user/services/user.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { MailService } from './mail.service';
import { generateToken } from '../common/additional.functions';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from 'src/modules/user/entities/user.entity';
import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { ProfileService } from 'src/modules/user/services/profile.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly profileService: ProfileService,
    private jwtService: JwtService,
    private mailService: MailService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async generateAccessToken(userId: number) {
    return this.jwtService.sign({sub: String(userId)})
  }

  async generateRefreshToken(userId: number) {
    return this.jwtService.sign(
      { sub: userId },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: '7d'
        }
    )
  }  

  async sendAuthResponse(
    req: Request,
    res: Response,
    payload: {
      accessToken: string;
      refreshToken: string;
    }
  ) {
    const isBrowser =
      /Mozilla|Chrome|Safari|Firefox|Edge|Opera/i.test(req.headers['user-agent'] || '') &&
      (req.headers['accept'] || '').includes('text/html');

    if (isBrowser) {
      res.cookie('refreshToken', payload.refreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, 
      });

      return res.status(200).json({
        accessToken: payload.accessToken,
      });
    }

    return res.status(200).json(payload); 
  }

  async refreshToken(token: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    const user = await this.usersService.getUserById(decoded.sub);
    if (!user || user.refreshToken !== token) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    const newAccessToken = await this.generateAccessToken(user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: token,
    };
  }

  async validateUser(authPayloadDto: AuthPayloadDto) {
    const findUser = await this.usersService.findByEmail(authPayloadDto.email);

    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    const passwordIsMatch = await argon2.verify(
      findUser.password,
      authPayloadDto.password,
    );

    if (passwordIsMatch) {
      return findUser.id;
    } else {
      throw new NotFoundException('Incorrect credentials');
    }
  }

  async login(userId: number) {
    const accessToken = await this.generateAccessToken(userId);
    const refreshToken = await this.generateRefreshToken(userId);

    await this.usersService.updateRefreshToken(userId, refreshToken);

    return {
        accessToken,
        refreshToken,
    };
  }

  async registerUser(dto: { email: string; password: string; firstName: string; lastName: string }) {
    const userData = {
      ...dto,
      password: dto.password,
      role: UserRole.USER,      
      isOAuthUser: false,       
    };

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) throw new BadRequestException('User already exists');

    const user = await this.createUserWithProfile(userData);

    const accessToken = await this.generateAccessToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);
    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async findOrCreateUser(dto: {
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
  }) {
    const userData = {
      ...dto,
      role: UserRole.USER,
      isOAuthUser: true,
    };
    const user = await this.createUserWithProfile(userData);

    const accessToken = await this.generateAccessToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);
    await this.usersService.updateRefreshToken(user.id, refreshToken);
  
    return {
      accessToken,
      refreshToken,
    };
  }

  private async createUserWithProfile(params: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isOAuthUser: boolean;
  }): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const profile = await this.profileService.createProfileTransactional(
        {
          firstName: params.firstName,
          lastName: params.lastName,
          avatarUrl: null,
        },
        manager,
      );

      return this.usersService.createUserTransactional(
        {
          email: params.email,
          password: params.password ? await argon2.hash(params.password) : undefined,
          role: params.role,
          isOAuthUser: params.isOAuthUser,
          profile,
        },
        manager,
      );
    });
  }

  async checkEmail(email: string) {
    const emailMod = email?.trim();

    if (!emailMod) {
      return { exists: false, message: 'Invalid email' };
    }
    return this.usersService.findByEmail(email);
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found...');
    }
    const passwordMatch = await argon2.verify(oldPassword, newPassword);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }
    await this.usersService.updatePassword(userId, newPassword);
  }

  async resetPassword(userId: number, newPassword: string, resetToken: string) {
    const user = await this.usersService.getUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found...');
    }

    if (!user.resetPasswordToken || resetToken !== user.resetPasswordToken) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (user.tokenExpiredDate && user.tokenExpiredDate < new Date()) {
      throw new UnauthorizedException('Reset token expired');
    }

    await this.usersService.updatePassword(user.id, newPassword);

    await this.usersService.updateUserToken(user.id, {
      resetPasswordToken: null,
      tokenExpiredDate: null,
    });
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'If this user exists, they will receive an email!' };
    }

    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    const resetToken = generateToken(32);

    await this.usersService.updateUserToken(user.id, {
      resetPasswordToken: null,
      tokenExpiredDate: null,
    });

    await this.usersService.updateUserToken(user.id, {
      resetPasswordToken: resetToken,
      tokenExpiredDate: expiryDate,
    });

    await this.mailService.sendPasswordResetEmail(email, user.id, resetToken);

    return { message: 'If this user exists, they will receive an email' };
  }
}
