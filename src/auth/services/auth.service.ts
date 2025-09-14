import {
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

  async refreshToken(token: string): Promise<{
    user: { id: number; email: string; role: string };
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
      user: { id: user.id, email: user.email, role: user.role },
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = findUser;
      return result;
    } else {
      throw new NotFoundException('Incorrect credentials');
    }
  }

  async login(user: IUser, isWeb: boolean = false) {
    const { id, email, role } = user;
    const accessToken = await this.generateAccessToken(id);
    const refreshToken = await this.generateRefreshToken(id);

    await this.usersService.updateRefreshToken(id, refreshToken );

    if (isWeb) {
        return {
            id,
            email,
            role,
            accessToken,
        };
    } else {
        return {
            id,
            email,
            role,
            accessToken,
            refreshToken,
        };
    }
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
