import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import s3 from '../config/s3.js'
import FileModel from "models/SharedFile.js";
import { Multipart, MultipartFile } from "@fastify/multipart";

interface uploadParams {
    username: string;
    roomId: string;
    file: MultipartFile;
    uploaderIp: string;
}

export async function UploadFileToS3AndSaveMetaData({file, roomId, username, uploaderIp}: uploadParams) {
    const fileKey = `${roomId}/${randomUUID()}-${file.filename}`

    const fileBuffer = await file.toBuffer();

    await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: fileKey,
          Body: fileBuffer,
          ContentType: file.mimetype,
        })
    )
    
    const fileUploadMeta = new FileModel({
        originalName: file.fieldname,
        storedName: fileKey,
        size: fileBuffer.length,
        mimeType: file.mimetype,
        uploadTime: new Date(),
        downloadCount: 0,
        uploaderIp: uploaderIp,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000 * 24)
    })
} 