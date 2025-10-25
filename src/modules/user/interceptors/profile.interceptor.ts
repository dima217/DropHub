import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ProfileService } from '../services/profile.service';

@Injectable()
export class LoadProfileInterceptor implements NestInterceptor {
  constructor(private readonly profileService: ProfileService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    if (req.user && !req.user.profile) {
      req.user.profile = await this.profileService.getProfileByUserId(req.user.id);
    }
    return next.handle();
  }
}
