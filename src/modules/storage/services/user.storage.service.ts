import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserStorageDocument } from "../schemas/storage.schema";
import { Model } from "mongoose";

@Injectable()
export class UserStorageService {
    constructor(
        @InjectModel("UserStorage") private readonly userStorageModel: Model<UserStorageDocument>
    ) {}

    async addItem(userId: string) {
        
    }
    
    async getUserStorage(userId: string) {
        const storage = await this.userStorageModel.findOne({ userId }).populate("files");
        return storage;
    }
}