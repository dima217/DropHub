import { Body, Controller, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProfileService } from '../services/profile.service';
import { UserUpdateProfileDTO } from '../dto/update-profile.dto';
import { AuthGuard } from '@nestjs/passport';
import type { RequestWithUser } from 'src/types/express';
import { ContactDto } from '../dto/contact.dto';

@Controller('/profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('/update')
  async updateProfile(@Req() req: RequestWithUser, @Body() body: UserUpdateProfileDTO) {
    return this.profileService.updateProfile(req.user.profileId, body);
  }

  @Post('/add-contact')
  async addContact(@Req() req: RequestWithUser, @Body() body: ContactDto) {
    this.profileService.addContact(req.user.profileId, body.contactId);
  }

  @Post('/remove-contact')
  async removeContact(@Req() req: RequestWithUser, @Body() body: ContactDto) {
    this.profileService.removeContact(req.user.profileId, body.contactId);
  }
}
