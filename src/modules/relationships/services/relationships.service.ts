import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/modules/user/services/user.service';
import { Repository } from 'typeorm';
import { FriendRequest, RequestStatus } from '../entities/friend-request.entity';
import { Friend } from '../entities/friend.entity';

@Injectable()
export class RelationshipsService {
  private readonly logger = new Logger(RelationshipsService.name);

  constructor(
    @InjectRepository(FriendRequest)
    private readonly requestRepository: Repository<FriendRequest>,
    @InjectRepository(Friend)
    private readonly friendRepository: Repository<Friend>,
    private readonly usersService: UsersService,
    // private readonly notificationService: NotificationService,
  ) {}

  private normalizeIds(id1: number, id2: number): { userOneId: number; userTwoId: number } {
    return id1 < id2 ? { userOneId: id1, userTwoId: id2 } : { userOneId: id2, userTwoId: id1 };
  }

  async areFriends(userAId: number, userBId: number): Promise<boolean> {
    if (userAId === userBId) return true;

    const { userOneId, userTwoId } = this.normalizeIds(userAId, userBId);

    const friendEntry = await this.friendRepository.findOne({
      where: { userOneId, userTwoId },
    });

    return !!friendEntry;
  }

  async createMutualFriends(userAId: number, userBId: number): Promise<void> {
    if (userAId === userBId) return;

    const { userOneId, userTwoId } = this.normalizeIds(userAId, userBId);

    const isAlreadyFriend = await this.areFriends(userAId, userBId);
    if (isAlreadyFriend) {
      return;
    }

    const newFriendship = this.friendRepository.create({ userOneId, userTwoId });
    await this.friendRepository.save(newFriendship);
  }

  async sendFriendRequest(senderId: number, targetEmail: string): Promise<FriendRequest> {
    const targetUser = await this.usersService.findUserForContact(targetEmail);

    if (!targetUser) {
      throw new NotFoundException(
        'Пользователь не найден в приложении. Используйте приглашение по Email.',
      );
    }
    const receiverId = targetUser.id;

    if (senderId === receiverId) {
      throw new BadRequestException('Нельзя отправить запрос самому себе.');
    }
    if (await this.areFriends(senderId, receiverId)) {
      throw new BadRequestException('Уже в друзьях.');
    }

    const existingRequest = await this.requestRepository.findOne({
      where: [
        { senderId, receiverId, status: RequestStatus.PENDING },
        { senderId: receiverId, receiverId: senderId, status: RequestStatus.PENDING },
      ],
    });

    if (existingRequest) {
      throw new BadRequestException('Активный запрос на дружбу уже существует.');
    }

    const request = this.requestRepository.create({ senderId, receiverId });
    await this.requestRepository.save(request);

    /* await this.notificationService.notify(
      receiverId,
      `Вам пришел новый запрос на дружбу от ${senderId}`,
    ); */

    return request;
  }

  async acceptRequest(receiverId: number, requestId: number): Promise<void> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, receiverId, status: RequestStatus.PENDING },
    });

    if (!request) {
      throw new NotFoundException('Запрос не найден или неактивен.');
    }

    await this.createMutualFriends(request.senderId, receiverId);

    request.status = RequestStatus.ACCEPTED;
    await this.requestRepository.save(request);

    // await this.notificationService.notify(request.senderId, `Ваш запрос на дружбу был принят!`);
  }

  async rejectRequest(receiverId: number, requestId: number): Promise<void> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, receiverId, status: RequestStatus.PENDING },
    });

    if (!request) {
      throw new NotFoundException('Запрос не найден или неактивен.');
    }

    request.status = RequestStatus.REJECTED;
    await this.requestRepository.save(request);

    // await this.notificationService.notify(request.senderId, `Ваш запрос на дружбу был отклонен.`);
  }

  async cancelRequest(senderId: number, requestId: number): Promise<void> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, senderId, status: RequestStatus.PENDING },
    });

    if (!request) {
      throw new NotFoundException('Запрос не найден или не может быть отменен.');
    }

    request.status = RequestStatus.CANCELED;
    await this.requestRepository.save(request);

    // await this.notificationService.notify(request.receiverId, `Запрос на дружбу был отменен.`);
  }
}
