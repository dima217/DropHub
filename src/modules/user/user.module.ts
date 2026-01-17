import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';

import { UsersService } from './services/user.service';
import { ProfileService } from './services/profile.service';

import { UserController } from './controllers/user.controller';
import { ImageModule } from '../images/image.module';

import { CacheModule } from '@cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile]),
    ImageModule,
    CacheModule
  ],
  controllers: [UserController],
  providers: [UsersService, ProfileService],
  exports: [UsersService, ProfileService],
})
export class UserModule {}
