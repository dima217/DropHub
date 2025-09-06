import { Module } from "@nestjs/common";
import { UserStorageController } from "./controllers/user.storage.controller";
import { UserStorageService } from "./services/user.storage.service";

@Module({
    controllers: [UserStorageController],
    providers: [UserStorageService],
})

export class UserStorageModule {};