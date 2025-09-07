import { NestFactory } from "@nestjs/core";
import { FileCleanAppModule } from "./file.queue.module.js";

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(FileCleanAppModule);
    console.log('Worker running...');
}
bootstrap();