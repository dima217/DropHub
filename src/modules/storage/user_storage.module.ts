import { Module } from "@nestjs/common";
import { UserStorageController } from "./controllers/user.storage.controller";
import { UserStorageService } from "./services/user.storage.service";
import { FileModule } from "../file/files.module";

@Module({
    controllers: [UserStorageController],
    providers: [UserStorageService],
    imports: [FileModule],
})

export class UserStorageModule {};