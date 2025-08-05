import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import s3 from '../config/s3'
import FileModel from "../models/SharedFile";
import { Multipart, MultipartFile } from "@fastify/multipart";

interface uploadParams {
    roomId: string;
    file: MultipartFile;
    uploaderIp: string;
}

export async function UploadFileToS3AndSaveMetaData({file, roomId, uploaderIp}: uploadParams) {
    const fileKey = `${roomId}/${randomUUID()}-${file.filename}`

    const fileBuffer = await file.toBuffer();

    console.log('AccessKeyId:', process.env.S3_ACCESS_KEY_ID);
    console.log('SecretAccessKey:', process.env.S3_SECRET_ACCESS_KEY);

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

    await fileUploadMeta.save();
} 

