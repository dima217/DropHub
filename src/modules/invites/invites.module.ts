// src/invites/invites.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenModule } from '../token/token.module';
import { InvitesController } from './controllers/invites.controller';
import { Invite } from './entities/invite.entity';
import { InviteService } from './services/invites.service';
import { RelationshipsModule } from '../relationships/relationships.module';

@Module({
  imports: [TypeOrmModule.forFeature([Invite]), TokenModule, RelationshipsModule],
  controllers: [InvitesController],
  providers: [InviteService],
  exports: [InviteService],
})
export class InvitesModule {}
