// src/invites/invites.controller.ts
import { Controller, Post, Body, Req, Query, ParseIntPipe, Get, HttpCode } from '@nestjs/common';
import { GenerateLinkDto } from '../dto/invite-link.dto';
import { InviteService } from '../services/invites.service';

@Controller('invite')
// @UseGuards(AuthGuard)
export class InvitesController {
  private getUserId(req: any): number {
    return parseInt(req.headers['x-user-id'] as string, 10) || 1;
  }
  constructor(private readonly inviteService: InviteService) {}

  @Post('link')
  async generateLink(@Req() req, @Body() body: GenerateLinkDto) {
    const senderId = this.getUserId(req);

    const result = await this.inviteService.generatePublicInviteLink(senderId, body.expiryDays);

    return {
      message: 'Universal link has been generated.',
      inviteUrl: result.url,
      token: result.token,
    };
  }

  @Get('validate')
  async validateLink(@Query('token') token: string) {
    const invite = await this.inviteService.validateInviteToken(token);

    return {
      isValid: true,
      senderId: invite.senderId,
    };
  }

  @Post('finalize')
  @HttpCode(204)
  async finalize(@Body('token') token: string, @Body('newUserId') newUserId: number) {
    await this.inviteService.finalizeRegistration(token, newUserId);
  }
}
