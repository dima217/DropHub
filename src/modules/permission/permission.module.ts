import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {Permission} from '@modules/permission/entities/permission.entity';

import { UniversalPermissionService } from './services/permission.service';
import { PermissionController } from './permission.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  controllers: [PermissionController],
  providers: [UniversalPermissionService],
  exports: [UniversalPermissionService],
})
export class PermissionModule {}
