import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from 'src/modules/user/services/user.service';
import { FriendRequest, RequestStatus } from '../entities/friend-request.entity';
import { Friend } from '../entities/friend.entity';
import { CentrifugoService } from 'src/modules/notification/centrifugo.service';

@Injectable()
export class RelationshipsService {
  constructor(
    @InjectRepository(FriendRequest)
    private readonly requestRepository: Repository<FriendRequest>,
    @InjectRepository(Friend)
    private readonly friendRepository: Repository<Friend>,
    private readonly usersService: UsersService,
    private readonly centrifugo: CentrifugoService,
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
    if (isAlreadyFriend) return;
    const newFriendship = this.friendRepository.create({ userOneId, userTwoId });
    await this.friendRepository.save(newFriendship);
  }

  async sendFriendRequest(senderId: number, targetEmail: string): Promise<FriendRequest> {
    const targetUser = await this.usersService.findUserForContact(targetEmail);
    if (!targetUser) throw new NotFoundException('User not found.');
    const receiverId = targetUser.id;

    if (senderId === receiverId)
      throw new BadRequestException('Cannot send a request to yourself.');
    if (await this.areFriends(senderId, receiverId))
      throw new BadRequestException('Already friends.');

    const existingRequest = await this.requestRepository.findOne({
      where: [
        { senderId, receiverId, status: RequestStatus.PENDING },
        { senderId: receiverId, receiverId: senderId, status: RequestStatus.PENDING },
      ],
    });
    if (existingRequest) throw new BadRequestException('Active request already exists.');

    const request = this.requestRepository.create({ senderId, receiverId });
    await this.requestRepository.save(request);

    await this.centrifugo.publish(`personal#${receiverId}`, {
      type: 'friend_request_received',
      title: 'New friend request',
      message: `User ${senderId} sent you a friend request.`,
      senderId,
    });

    return request;
  }

  async acceptRequest(receiverId: number, requestId: number): Promise<void> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, receiverId, status: RequestStatus.PENDING },
    });
    if (!request) throw new NotFoundException('Request not found or inactive.');

    await this.createMutualFriends(request.senderId, receiverId);
    request.status = RequestStatus.ACCEPTED;
    await this.requestRepository.save(request);

    await this.centrifugo.publish(`personal#${request.senderId}`, {
      type: 'friend_request_accepted',
      title: 'Friend request accepted',
      message: `User ${receiverId} accepted your friend request.`,
      receiverId,
    });
  }

  async rejectRequest(receiverId: number, requestId: number): Promise<void> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, receiverId, status: RequestStatus.PENDING },
    });
    if (!request) throw new NotFoundException('Request not found or inactive.');

    request.status = RequestStatus.REJECTED;
    await this.requestRepository.save(request);

    await this.centrifugo.publish(`personal#${request.senderId}`, {
      type: 'friend_request_rejected',
      title: 'Friend request rejected',
      message: `User ${receiverId} rejected your friend request.`,
      receiverId,
    });
  }

  async cancelRequest(senderId: number, requestId: number): Promise<void> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId, senderId, status: RequestStatus.PENDING },
    });
    if (!request) throw new NotFoundException('Request not found or already cancelled.');

    request.status = RequestStatus.CANCELED;
    await this.requestRepository.save(request);

    await this.centrifugo.publish(`personal#${request.receiverId}`, {
      type: 'friend_request_cancelled',
      title: 'Friend request cancelled',
      message: `User ${senderId} cancelled the friend request.`,
      senderId,
    });
  }
}
