import { Module } from '@nestjs/common';
import { UserModule } from 'src/modules/user/user.module';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local-strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt-strategy';
import { GoogleStrategy } from './strategies/google-strategy';
import { RolesGuard } from './guards/roles-guard';
import { MailService } from './services/mail.service';
import { VerificationService } from './services/verification.service';
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { GoogleAuthService } from './services/google-auth.service';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '25sec' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    GoogleAuthService,
    VerificationService,
    MailService,
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy,
    RolesGuard,
    TokenService,
    PasswordService,
    WsJwtAuthGuard,
  ],
  exports: [WsJwtAuthGuard, JwtModule],
  controllers: [AuthController],
})
export class AuthModule {}
