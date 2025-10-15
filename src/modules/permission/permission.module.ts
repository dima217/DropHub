import { Module } from '@nestjs/common';
import { TokenModule } from '../token/token.module';
import { UniversalPermissionService } from './services/permission.service';
import { TokenService } from '../token/services/token.service';

@Module({
  exports: [UniversalPermissionService],
  providers: [UniversalPermissionService],
})
export class PermissionModule {}
