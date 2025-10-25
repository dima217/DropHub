import { Body, Controller, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProfileService } from '../services/profile.service';
import { UserUpdateProfileDTO } from '../dto/update-profile.dto';
import { AuthGuard } from '@nestjs/passport';
import type { RequestWithProfile } from 'src/types/express';
import { LoadProfileInterceptor } from '../interceptors/profile.interceptor';

@Controller('/profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('/update')
  @UseInterceptors(LoadProfileInterceptor)
  async updateProfile(@Req() req: RequestWithProfile, @Body() body: UserUpdateProfileDTO) {
    return this.profileService.updateProfile(req.profile, body);
  }
}
