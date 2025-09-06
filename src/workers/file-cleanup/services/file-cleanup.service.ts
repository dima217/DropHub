import { Injectable } from "@nestjs/common";
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from "@nestjs/schedule";
import { Model } from "mongoose";
import { File, FileDocument } from "src/modules/file/schemas/file.schema";
import { FileQueueService } from "src/workers/file-cleanup/services/file.queue.service";

@Injectable()
export class FileCleanupService {
    constructor(
        private readonly fileQueueService: FileQueueService,
        @InjectModel(File.name) private readonly fileModel: Model<FileDocument>
    ) {}

    @Cron('*/5 * * * *') 
    async handleCron() {
        const expiredFiles = await this.fileModel.find(
            {expiresAt: {$lte: new Date()}
        });
        for (const file of expiredFiles) {
            this.fileQueueService.addFileToDeleteQueue(file.storedName);
        }
    }
}