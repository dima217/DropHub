import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { SendRequestDto } from '../dto/friend-request.dto';
import { RelationshipsService } from '../services/relationships.service';

@Controller('relationships')
// @UseGuards(AuthGuard)
export class RelationshipsController {
  private getUserId(req: any): number {
    if (!req.headers['x-user-id']) {
      throw new NotFoundException('X-User-ID заголовок отсутствует.');
    }
    return parseInt(req.headers['x-user-id'] as string, 10);
  }

  constructor(private readonly relationshipsService: RelationshipsService) {}

  @Post('request')
  async sendRequest(@Req() req, @Body() sendRequestDto: SendRequestDto) {
    const senderId = this.getUserId(req);

    try {
      const request = await this.relationshipsService.sendFriendRequest(
        senderId,
        sendRequestDto.email,
      );
      return { message: 'Запрос на контакт отправлен.', requestId: request.id };
    } catch (error) {
      if (error instanceof NotFoundException && error.message.includes('не найден')) {
        // Здесь была бы логика вызова InviteService
        return {
          message: 'Пользователь не найден в приложении. Отправляется приглашение по Email.',
        };
      }
      throw error;
    }
  }

  @Post('accept/:requestId')
  async acceptRequest(@Req() req, @Param('requestId', ParseIntPipe) requestId: number) {
    const receiverId = this.getUserId(req);
    await this.relationshipsService.acceptRequest(receiverId, requestId);
    return { message: 'Request accepted.' };
  }

  @Post('reject/:requestId')
  async rejectRequest(@Req() req, @Param('requestId', ParseIntPipe) requestId: number) {
    const receiverId = this.getUserId(req);
    await this.relationshipsService.rejectRequest(receiverId, requestId);
    return { message: 'Request rejected.' };
  }

  @Post('cancel/:requestId')
  async cancelRequest(@Req() req, @Param('requestId', ParseIntPipe) requestId: number) {
    const senderId = this.getUserId(req);
    await this.relationshipsService.cancelRequest(senderId, requestId);
    return { message: 'Request canceled.' };
  }
}
