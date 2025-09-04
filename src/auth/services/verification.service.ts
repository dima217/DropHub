import { Injectable, BadRequestException } from '@nestjs/common';
import { MailService } from './mail.service';
import { CacheService } from 'src/cache/cache.service';
import { nanoid } from 'nanoid';

const EMAIL_CODE_TTL = 600; 
const EMAIL_CODE_PREFIX = 'emailCode:';

@Injectable()
export class VerificationService {
  constructor(
    private readonly mailService: MailService,
    private readonly cacheService: CacheService,
  ) {}

  async sendEmailCode(email: string) {
    const cacheKey = `${EMAIL_CODE_PREFIX}${email}`;
    const existingCode = await this.cacheService.get(cacheKey);

    if (existingCode) {
      throw new BadRequestException('Code already sent, wait before retrying');
    }

    const code = this.generateCode();

    await this.cacheService.set(cacheKey, code, EMAIL_CODE_TTL);

    const html = `
      <p style="font-size: 16px;">
        Your verification code is: <strong>${code}</strong>
      </p>
      <p style="color: #888; font-size: 12px;">
        This code is valid for 10 minutes.
      </p>
    `;

    await this.mailService.sendRawHtml(email, 'Email Verification Code', html);
  }

  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    const cacheKey = `${EMAIL_CODE_PREFIX}${email}`;
    const cachedCode = await this.cacheService.get(cacheKey);

    if (!cachedCode || cachedCode !== code) {
      throw new BadRequestException('Invalid or expired code');
    }

    await this.cacheService.delete(cacheKey);
    return true;
  }

  private generateCode(): string {
    return Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
  }
}
