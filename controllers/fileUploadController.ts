import { MultipartFile } from "@fastify/multipart";
import { FastifyReply, FastifyRequest } from "fastify";
import { completeMultipart, initUploading, initUploadMultipart, UploadFileToS3AndSaveMetaData } from "services/fileUpload";
import { UploadComplete, UploadInitMultipart, UploadInitRequestBody } from "constants/interfaces";

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