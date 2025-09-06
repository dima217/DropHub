import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

@Injectable()
export class FileCleanupService {
    constructor(@InjectQueue('file-cleanup') private readonly queue: Queue) {}

    async addFileToQueue(storedName: string) {
        await this.queue.add('delete-file',{ storedName });
    }
}