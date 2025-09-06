import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserStorageDocument } from "../schemas/user.storage.schema";
import { Model } from "mongoose";

@Injectable()
export class UserStorageService {
    constructor(
        @InjectModel("UserStorage") private readonly userStorageModel: Model<UserStorageDocument>
    ) {}

    async addFiles(userId: string, keys: string[]) {
        const storage = await this.userStorageModel.findOneAndUpdate(
          { userId },
          { $addToSet: { files: { $each: keys } } },
          { upsert: true, new: true }
        );
    
        return storage;
    }
    
    async removeFiles(userId: string, keys: string[]) {
        const storage = await this.userStorageModel.findOneAndUpdate(
          { userId },
          { $pull: { files: { $in: keys } } },
          { new: true }
        );
    
        return storage;
    }
    
    async getUserStorage(userId: string) {
        const storage = await this.userStorageModel.findOne({ userId }).populate("files");
        return storage;
    }
}