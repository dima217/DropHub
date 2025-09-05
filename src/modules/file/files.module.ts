import { Module } from "@nestjs/common";
import { S3Module } from "src/s3/s3.module";

@Module({
    imports: [S3Module]
})

export class fileModule {}