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
import { IUser } from '../types/types';
import { MailService } from './mail.service';
import { generateToken } from '../common/additional.functions';
import { ConfigService } from '@nestjs/config';
import { UserRole } from 'src/modules/user/entities/user.entity';
import { RegisterUserDto } from '../dto/register.dto';
import { Request, Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private readonly configService: ConfigService,
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
      const { email } = findUser;
      return email;
    } else {
      throw new NotFoundException('Incorrect credentials');
    }
  }

  async login(email: string) {

    const user = await this.usersService.findByEmail(email);

    if (!user) throw new UnauthorizedException('User not found');

    const accessToken = await this.generateAccessToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);

    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
        accessToken,
        refreshToken,
    };
  }

  async registerUser(dto: { email: string; password: string; firstName: string; lastName: string }) {
    let user = await this.usersService.findByEmail(dto.email);
    if (user) {
      throw new BadRequestException('User already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    user = await this.usersService.createUser({
      ...dto,
      password: passwordHash,
      role: UserRole.USER,
      isOAuthUser: false,
    });

    const accessToken = await this.generateAccessToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);
    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      user: { id: user.id, email: user.email, firstName: user.firstName },
      accessToken,
      refreshToken,
    };
  }

  async findOrCreateUser(userDto: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    picture?: string;
    isOAuthUser: boolean;
  }) {
    let user = await this.usersService.findByEmail(userDto.email);
  
    if (!user) {
      const passwordHash = userDto.password
        ? await argon2.hash(userDto.password)
        : null;
  
      user = await this.usersService.createUser({
        ...userDto,
        password: passwordHash!,
        role: UserRole.USER,
        avatarUrl: userDto.picture,
        isOAuthUser: userDto.isOAuthUser,
      });
    }
    const accessToken = await this.generateAccessToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);
    await this.usersService.updateRefreshToken(user.id, refreshToken);
  
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
      },
      accessToken,
      refreshToken,
    };
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
