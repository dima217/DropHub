import { MultipartFile } from "@fastify/multipart";
import { FastifyReply, FastifyRequest } from "fastify";
import { UploadFileToS3AndSaveMetaData } from "../services/fileUpload";
import { RoomModel } from "../models/FileRoom";

export interface UploadRequestBody {
  roomId: string;
}

// interface UploadRequest extends FastifyRequest<{ Body: UploadRequestBody }> {}

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
