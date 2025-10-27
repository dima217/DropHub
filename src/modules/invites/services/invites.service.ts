// src/invites/invites.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RelationshipsService } from 'src/modules/relationships/services/relationships.service';
import { TokenService } from 'src/modules/token/services/token.service';
import { Repository } from 'typeorm';
import { Invite, InviteStatus } from '../entities/invite.entity';
import { ResourceType } from 'src/modules/permission/entities/permission.entity';

@Injectable()
export class InviteService {
  private readonly INVITE_EXPIRY_DAYS = 7;

  constructor(
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
    private readonly tokenService: TokenService,
    private readonly relationshipsService: RelationshipsService,
  ) {}

  async generatePublicInviteLink(
    senderId: number,
    expiryDays?: number,
  ): Promise<{ token: string; url: string }> {
    const days = expiryDays || this.INVITE_EXPIRY_DAYS;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const { token, url: baseUrl } = await this.tokenService.generatePublicLink(
      { resourceId: String(senderId), resourceType: ResourceType.INVITE, role: 'R' },
      `${days}d`,
    );

    const invite = this.inviteRepository.create({
      senderId,
      token,
      expiresAt,
    });
    await this.inviteRepository.save(invite);

    const inviteLink = `${baseUrl}/signup?invite_token=${token}`;

    return { token, url: inviteLink };
  }

  async validateInviteToken(token: string): Promise<Invite> {
    const invite = await this.inviteRepository.findOne({ where: { token } });

    if (!invite) {
      throw new UnauthorizedException('Приглашение не найдено.');
    }
    if (invite.status !== InviteStatus.PENDING) {
      throw new UnauthorizedException('Приглашение уже использовано или неактивно.');
    }
    if (invite.expiresAt < new Date()) {
      invite.status = InviteStatus.EXPIRED;
      await this.inviteRepository.save(invite);
      throw new UnauthorizedException('Срок действия приглашения истек.');
    }

    return invite;
  }

  async finalizeRegistration(token: string, newUserId: number): Promise<void> {
    const invite = await this.validateInviteToken(token);

    if (invite.senderId === newUserId) {
      throw new BadRequestException('Невозможно принять приглашение самому себе.');
    }

    await this.relationshipsService.createMutualFriends(invite.senderId, newUserId);

    invite.status = InviteStatus.USED;
    await this.inviteRepository.save(invite);
  }
}
