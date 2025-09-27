import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { FilesService } from "src/modules/file/services/file.service";
import { StorageItem } from "../schemas/storage.item.schema";

@Injectable()
export class StorageItemService {
    /* constructor(
        @InjectModel("StorageItem") private readonly itemModel: Model<StorageItem>,
        private readonly filesService: FilesService,
    ) {}

    async createItem(storageId: string, userId: number, file: Express.Multer.File, meta?: Record<string, any>) {
        if (!file) throw new BadRequestException("File is required");
    
        const uploaded = await this.filesService.(file);
    
        const item = await this.itemModel.create({
          storageId,
          fileId: uploaded.id,
          meta: meta || {},
          createdAt: new Date(),
          createdBy: userId,
        });
    
        return item;
    } */
}