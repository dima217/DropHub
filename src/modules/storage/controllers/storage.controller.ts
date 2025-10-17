import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { StorageService } from '../services/storage.service';
import { AuthGuard } from '@nestjs/passport';
import type { RequestWithUser } from 'src/types/express';

@Controller('storage')
export class UserStorageController {
  constructor(private readonly userStorageService: StorageService) {}

  /* @Post("files")
    async addFiles(@Body() body: ModifyFilesDto) {
      const { userId, keys } = body;
      return this.userStorageService.addFiles(userId, keys);
    }
  
    @Delete("files")
    async removeFiles(@Body() body: ModifyFilesDto) {
      const { userId, keys } = body;
      return this.userStorageService.removeFiles(userId, keys);
    } */

  @Post()
  @UseGuards(AuthGuard)
  async getUserStorage(@Req() req: RequestWithUser) {
    return this.userStorageService.getStoragesByUserId(req.user.id);
  }
}
