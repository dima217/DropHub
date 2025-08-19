import { FastifyReply, FastifyRequest } from "fastify";
import { getStream } from "services/fileDownload";
import FileModel from "models/SharedFile";
import { downloadInterface } from "constants/interfaces";


export async function downloadFileController(req: FastifyRequest<downloadInterface>, reply: FastifyReply) {
  try {
    let key = req.body.key;
    const fileDoc = await FileModel.findOne({ key }).lean(); // getting clear json by .lean()
    if (!fileDoc) {
      reply.code(404).send(({error: "File doc does not exist"}))
    }
    const mimeType = fileDoc?.mimeType || "application/octet-stream"; //"application/octet-stream" - random binary data

    const stream = getStream(req.body);

    if (!stream) {
      reply.code(404).send(({error: "File not found in S3"}))
    }

    reply
    .header("Content-Type", mimeType)
    .header("Content-Disposition", `attachment; filename="${key}"`)
    .send(stream);

  } catch(err) {
    req.log.error(err);
    return reply.code(500).send(({error: "Could not upload file"}))
  }
}


