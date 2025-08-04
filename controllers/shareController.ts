import { MultipartFile } from "@fastify/multipart";
import { File } from "buffer";
import { FastifyReply, FastifyRequest } from "fastify"
import { UploadFileToS3AndSaveMetaData } from "services/fileUpload";

export interface uploadRequestBody {
    roomId: string;
    username: string;
}

interface UploadRequest extends FastifyRequest<{Body: uploadRequestBody}> {}

async function uploadController(req: UploadRequest, reply: FastifyReply) {
    const { roomId, username } = req.body
    const file = await req.file();
    const ip = req.ip;
  
    if (!file || !roomId || !username) {
      return reply.status(400).send({ error: "Missing fields" })
    }
  
    const saved = await UploadFileToS3AndSaveMetaData({
      file,
      roomId,
      username,
      uploaderIp: ip,
    })
  
    return reply.send({ success: true })
}

export default uploadController;