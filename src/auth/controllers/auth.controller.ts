import {
  Body,
  Controller,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LocalGuard } from '../guards/local-guard';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { RequestEmailCodeDto } from '../dto/request-email-code.dto';
import { VerifyEmailCodeDto } from '../dto/verify-email-code.dto';
import { VerificationService } from '../services/verification.service';
import type { LoginRequestUser, RefreshTokenRequest, RequestWithUser } from 'src/types/express';
import type { Request, Response } from 'express';
import { RefreshTokenGuard } from '../guards/refresh-token-guard';
import { AuthGuard } from '@nestjs/passport';
import { RegisterUserDto } from '../dto/register.dto';
import { AuthPayloadDto } from '../dto/auth.dto';
import { TokenService } from '../services/token.service';
import { PasswordService } from '../services/password.service';
import { GoogleMobileAuthDto } from '../dto/google-mobile-auth.dto';
import { GoogleAuthCodeDto } from '../dto/google-auth-code.dto';
import { GoogleAuthService } from '../services/google-auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly verificationService: VerificationService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  @Post('login')
  @UseGuards(LocalGuard)
  async login(
    @Req() request: LoginRequestUser,
    @Body() body: AuthPayloadDto,
    @Res() response: Response,
  ) {
    const { id, profile } = request.user;
    this.logger.error(id);
    const payload = await this.authService.login(id);
    return this.authService.sendAuthResponse(request, response, { ...payload, user: { profile } });
  }

  @Post('sign-up')
  async register(
    @Body() registerDto: RegisterUserDto,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const user = await this.authService.registerUser(registerDto);
    return this.authService.sendAuthResponse(request, response, user);
  }

  @Post('new-access-token')
  @UseGuards(RefreshTokenGuard)
  async refreshToken(@Req() request: RefreshTokenRequest) {
    const { refreshToken, isBrowser } = request;

    const payload = await this.tokenService.refreshToken(refreshToken);

    if (isBrowser) {
      request.res!.cookie('refreshToken', payload.refreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 1000,
      });

      return { accessToken: payload.accessToken };
    }
    return payload;
  }

  @Post('google/mobile')
  async googleAuthMobile(
    @Body() body: GoogleMobileAuthDto,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const payload = await this.googleAuthService.verifyGoogleIdToken(body.idToken);
    return this.authService.sendAuthResponse(request, response, payload);
  }

  @Post('google/exchange-code')
  async exchangeGoogleCode(
    @Body() body: GoogleAuthCodeDto,
    @Query('redirect_uri') redirectUri: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const payload = await this.googleAuthService.handleGoogleAuthCode(body.code, redirectUri);
    return this.authService.sendAuthResponse(request, response, payload);
  }

  @Post('google/refresh-token')
  @UseGuards(AuthGuard)
  async refreshGoogleToken(@Req() req: RequestWithUser) {
    const newAccessToken = await this.googleAuthService.refreshGoogleAccessToken(req.user.id);
    if (!newAccessToken) {
      throw new UnauthorizedException('No Google refresh token available');
    }
    return { googleAccessToken: newAccessToken };
  }

  @Post('google/get-valid-token')
  @UseGuards(AuthGuard)
  async getValidGoogleToken(@Req() req: RequestWithUser) {
    const accessToken = await this.googleAuthService.getValidGoogleAccessToken(req.user.id);
    if (!accessToken) {
      throw new UnauthorizedException('No Google tokens available');
    }
    return { googleAccessToken: accessToken };
  }

  @Post('check-email')
  async checkEmail(@Body() body: { email: string }) {
    const user = await this.authService.checkEmail(body.email);
    return { exists: !!user };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.passwordService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('email/send-code')
  async sendEmailCode(@Body() dto: RequestEmailCodeDto) {
    return this.verificationService.sendEmailCode(dto.email);
  }

  @Post('email/verify-code')
  verifyCode(@Body() dto: VerifyEmailCodeDto) {
    return this.verificationService.verifyEmailCode(dto.email, dto.code);
  }
}
