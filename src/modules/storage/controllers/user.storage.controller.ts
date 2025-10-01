import { Body, Controller, Post } from "@nestjs/common";
import { StorageService } from '../services/user.storage.service';

@Controller('storage')
export class UserStorageController {
    constructor(
        private readonly userStorageService: StorageService,
    ) {}

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
    async getUserStorage(@Body() body: { userId: number }) {
      return this.userStorageService.getStoragesByUserId(body.userId);
    }    
}