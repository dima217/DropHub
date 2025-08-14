import { MultipartFile } from "@fastify/multipart";
import { FastifyReply, FastifyRequest } from "fastify";
import { completeMultipart, initUploading, initUploadMultipart, UploadFileToS3AndSaveMetaData } from "../services/fileUpload";
import { RoomModel } from "../models/FileRoom";
import { error } from "console";
import { S3WriteStream } from "utils/S3WriteStream";

export interface UploadRequestBody {
  roomId: string;
}

export interface UploadInitRequestBody {
  Body: {
    fileSize: number;
  }
}

export interface UploadInitMultipart {
  Body: {
    fileName: string;
    totalParts: number;
  }
}

export interface UploadComplete {
  Body: {
    uploadId: string;
    key: string;
    parts: { ETag: string; PartNumber: number }[]; 
    roomId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }
}

// interface UploadInitRequest extends FastifyRequest<{ Body: UploadInitRequestBody }> {}

export async function uploadController(req: FastifyRequest, reply: FastifyReply) {
  try {
    let roomId: string | undefined;
    let file: MultipartFile | undefined;
    const ip = req.ip;

    const parts = req.parts();

    for await (const part of parts) {
      if (part.type === "file" && part.fieldname === "file") {
        file = part;
      } else if (part.type === "field" && part.fieldname === "roomId") {
        roomId = part.value as string;
      }
    }

    if (!file || !roomId) {
      return reply.status(400).send({ error: "Missing 'file' or 'roomId'" });
    }

    await UploadFileToS3AndSaveMetaData({
      file,
      roomId,
      uploaderIp: ip,
    });

    return reply.send({ success: true, message: "File uploaded successfully" });
  } catch (err) {
    req.log.error(err);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
}

export async function createRoomController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const newRoom = new RoomModel({
      createdAt: new Date(),
      maxBytes: 5000, 
    });

    const savedRoom = await newRoom.save();

    return reply.code(201).send({
      success: true,
      roomId: savedRoom._id.toString(),
    });
  } catch (err) {
    req.log.error(err);
    return reply.status(500).send({ error: "Could not create room" });
  }
}

export async function uploadInitController(req: FastifyRequest<UploadInitRequestBody>, reply: FastifyReply) {
  try {
    const strategy = await initUploading(req.body.fileSize)
    if (strategy) {
      reply.code(200).send({
        success: true,
        strategy: strategy
      })
    }
  } catch (err) {
    req.log.error(err);
    return reply.status(500).send({error: "Could not init upload"})
  }
}

export async function uploadMultipartInitController(req: FastifyRequest<UploadInitMultipart>, reply: FastifyReply) {
  try {
    const initRes = await initUploadMultipart(req.body.fileName, req.body.totalParts)
    if (initRes) {
      reply.code(200).send({
        success: true,
        data: initRes
      })
    }
  } catch (err) {
    req.log.error(err);
    return reply.status(500).send({error: "Could not init multipart upload"})
  }
}

export async function uploadCompleteController(req: FastifyRequest<UploadComplete>, reply: FastifyReply) {
  try {
    const ip = req.ip;
    await completeMultipart(req.body, ip);
  } catch(err) {
    req.log.error(err);
    return reply.code(500).send({error: "Could not complete multipart upload"})
  }
}




