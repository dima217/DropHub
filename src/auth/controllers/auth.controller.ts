import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LocalGuard } from '../guards/local-guard';
import { JwtAuthGuard } from '../guards/jwt-guard';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { RequestEmailCodeDto } from '../dto/request-email-code.dto';
import { VerifyEmailCodeDto } from '../dto/verify-email-code.dto';
import { VerificationService } from '../services/verification.service';
import type { FastifyReply } from 'fastify';
import type { AuthRequest, JwtAuthRequest } from 'src/types/express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
  ) {}

  @Post('login')
  @UseGuards(LocalGuard)
  login(@Req() req: AuthRequest) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: JwtAuthRequest) {
    return req.user;
  }

  @Post('check-email')
  async checkEmail(@Body() body: { email: string }) {
    const user = await this.authService.checkEmail(body.email);
    return { exists: !!user };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Get('reset-password')
  resetPasswordPage(
    @Query('userId') userId: string,
    @Query('resetToken') token: string,
    @Res() res: FastifyReply,
  ) {
    if (!userId || !token) {
      return res.status(HttpStatus.BAD_REQUEST).send('<h1>Invalid reset link</h1>');
    }

    console.log(
      `🔹 GET: Reset password page opened for userId=${userId}, token=${token}`,
    );

    const html = `
      <html>
      <head>
        <title>Reset Password</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f4f4f4; }
          .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center; width: 100%; max-width: 400px; }
          input, button { width: 100%; padding: 10px; margin-top: 10px; border-radius: 4px; border: 1px solid #ccc; }
          button { background-color: #4CAF50; color: white; border: none; cursor: pointer; font-size: 16px; }
          button:hover { background-color: #45a049; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Reset Your Password</h2>
          <form action="/auth/reset-password" method="POST">
            <input type="hidden" name="userId" value="${userId}" />
            <input type="hidden" name="token" value="${token}" />
            <label>New Password:</label>
            <input type="password" name="newPassword" required />
            <button type="submit">Change Password</button>
          </form>
        </div>
      </body>
      </html>
    `;

    res.header('Content-Type', 'text/html').status(HttpStatus.OK).send(html);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { userId: string; newPassword: string; token: string },
    @Res() res: FastifyReply,
  ) {
    console.log(`🟢 POST: Reset password attempt for userId=${body.userId}`);

    try {
      await this.authService.resetPassword(
        Number(body.userId),
        body.newPassword,
        body.token,
      );

      console.log(`✅ Password changed for userId=${body.userId}`);

      res.status(HttpStatus.OK).send(
        '<h1>Password successfully changed</h1><p>You can now log in with your new password.</p>',
      );
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      res.status(HttpStatus.BAD_REQUEST).send(`<h1>Error</h1><p>${error.message}</p>`);
    }
  }

  @Post('email/send-code')
  async sendEmailCode(@Body() dto: RequestEmailCodeDto) {
    return this.verificationService.sendEmailCode(dto.email);
  }

  @Post('email/verify-code')
  async verifyCode(@Body() dto: VerifyEmailCodeDto) {
    return this.verificationService.verifyEmailCode(dto.email, dto.code);
  }
}
