import { Module } from '@nestjs/common';
import { TokenModule } from '../token/token.module';
import { UniversalPermissionService } from './services/permission.service';
import { TokenService } from '../token/services/token.service';
import { PermissionController } from './permission.controller';

@Module({
  controllers: [PermissionController],
  exports: [UniversalPermissionService],
  providers: [UniversalPermissionService],
})
export class PermissionModule {}
