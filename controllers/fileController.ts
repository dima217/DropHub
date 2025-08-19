import { error } from "console";
import { FastifyReply, FastifyRequest } from "fastify";
import { deleteFiles, getFilesByRoomsID } from "services/fileService";

export interface DeleteFileBody {
    files: string[];
}

export interface GetFilesBody {
    roomId: string;
}

export async function deleteFileController(
    req: FastifyRequest<{ Body: DeleteFileBody }>,
    reply: FastifyReply
  ) {
    const { files } = req.body;
  
    if (!files || files.length === 0) {
      return reply.status(400).send({ error: "No files provided" });
    }
  
    try {
      const results = await deleteFiles({ files });
      reply.send({ success: true, updated: results.length });
    } catch (err) {
      reply.status(500).send({ error: "Failed to delete files", details: err });
    }
}

export async function getFilesController(req: FastifyRequest<{Body: GetFilesBody}>, reply: FastifyReply) {
    const { roomId } = req.body;

    if (!roomId) {
        return reply.status(400).send({error: "No roomId provided"})
    }

    try {
        const files = await getFilesByRoomsID(roomId);
        reply.status(200).send(files);
    } catch(err) {
        reply.status(404).send({error: "Failed reaching room:", details: err})
    }
}
  