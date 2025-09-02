import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import s3 from '../config/s3'
import FileModel from "../models/SharedFile";
import { Multipart, MultipartFile } from "@fastify/multipart";
import { RoomModel } from "models/FileRoom";
import { MAX_UPLOAD_SIZE, UPLOAD_STRATEGY } from "constants/constants";
import { S3WriteStream } from "utils/S3WriteStream";;

const stream = new S3WriteStream('drop-hub-storage');
interface uploadParams {
    roomId: string;
    file: MultipartFile;
    uploaderIp: string;
}

export interface UploadComplete {
    uploadId: string;
    key: string;
    parts: { ETag: string; PartNumber: number }[]; 
    roomId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
}

interface MultipartInitResponse {
    uploadId: string;
    key: string;
    presignedUrls: Record<number, string>;
  }

export async function UploadFileToS3AndSaveMetaData({file, roomId, uploaderIp}: uploadParams) {

    const fileKey = `${roomId}/${randomUUID()}-${file.filename}`
    const fileBuffer = await file.toBuffer();

    await s3.send(
        new PutObjectCommand({
          Bucket: 'drop-hub-storage',
          Key: fileKey,
          Body: fileBuffer,
          ContentType: file.mimetype,
        })
    )
    
    const fileUploadMeta = new FileModel({
        originalName: file.filename,
        storedName: fileKey,
        size: fileBuffer.length,
        mimeType: file.mimetype,
        uploadTime: new Date(),
        downloadCount: 0,
        uploaderIp: uploaderIp,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000 * 24)
    })

    await RoomModel.findByIdAndUpdate(roomId, {
        $push: {files: fileUploadMeta.id}
    })

    await fileUploadMeta.save();
}

export async function initUploading(fileSize: number) {
    if (fileSize >= MAX_UPLOAD_SIZE) {
        return UPLOAD_STRATEGY.MULTIPART;
    }
    else if (fileSize <= MAX_UPLOAD_SIZE) {
        return UPLOAD_STRATEGY.SINGLE;
    } 
    else {
        return null;
    }
}

export async function initUploadMultipart(fileName: string, totalParts: number): Promise<MultipartInitResponse>  {

    return stream.initMultipart(fileName, totalParts)
}

export async function completeMultipart(
    params: UploadComplete, ip: string
) {
    stream.completeMultipart(params.key, params.uploadId, params.parts);
    
    const fileUploadMeta = new FileModel({
        originalName: params.fileName,
        storedName: params.key,
        size: params.fileSize,
        mimeType: params.fileType,
        uploadTime: new Date(),
        downloadCount: 0,
        uploaderIp: ip,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000 * 24)
    })

    await RoomModel.findByIdAndUpdate(params.roomId, {
        $push: {files: fileUploadMeta.id},
        $set: {"uploadSession.status": "complete"}
    })
    await fileUploadMeta.save();
}

export async function cancelUpload(roomId: string, uploadId: string) {
    await RoomModel.findOneAndUpdate(
      { _id: roomId, "uploadSession.uploadId": uploadId },
      { $set: { "uploadSession.status": "canceled" } }
    );
}

export async function stopUpload(roomId: string, uploadId: string) {
    await RoomModel.findOneAndUpdate(
      { _id: roomId, "uploadSession.uploadId": uploadId },
      { $set: { "uploadSession.status": "stopped" } }
    );
}




