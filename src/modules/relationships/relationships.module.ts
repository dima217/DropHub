import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RelationshipsController } from './controllers/relationships.controller';
import { FriendRequest } from './entities/friend-request.entity';
import { Friend } from './entities/friend.entity';
import { RelationshipsService } from './services/relationships.service';
import { UserModule } from '../user/user.module';
import { CentrifugoModule } from '../notification/centrifugo.module';

@Module({
  imports: [TypeOrmModule.forFeature([FriendRequest, Friend]), UserModule, CentrifugoModule],
  controllers: [RelationshipsController],
  providers: [RelationshipsService],
  exports: [RelationshipsService],
})
export class RelationshipsModule {}
