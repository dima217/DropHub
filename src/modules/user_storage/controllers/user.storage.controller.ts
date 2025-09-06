import { Body, Controller, Delete, Post } from "@nestjs/common";
import { UserStorageService } from '../services/user.storage.service';
import { ModifyFilesDto } from "../dto/mofify.files.dto";

@Controller()
export class UserStorageController {
    constructor(
        private readonly userStorageService: UserStorageService,
    ) {}

    @Post("files")
    async addFiles(@Body() body: ModifyFilesDto) {
      const { userId, keys } = body;
      return this.userStorageService.addFiles(userId, keys);
    }
  
    @Delete("files")
    async removeFiles(@Body() body: ModifyFilesDto) {
      const { userId, keys } = body;
      return this.userStorageService.removeFiles(userId, keys);
    }
  
    @Post("get") 
    async getUserStorage(@Body() body: { userId: string }) {
      return this.userStorageService.getUserStorage(body.userId);
    }
}