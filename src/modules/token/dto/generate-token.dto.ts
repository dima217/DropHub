import { IsEnum, IsString } from 'class-validator';
import { ResourceType } from 'src/modules/permission/entities/permission.entity';
import { AccessRole } from '../services/token.service';

export class GenerateTokenDto {
  @IsString()
  resourceId: string;

  @IsEnum(ResourceType)
  resourceType: ResourceType;

  @IsEnum(AccessRole)
  role: AccessRole;
}
