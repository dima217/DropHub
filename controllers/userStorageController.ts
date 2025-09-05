import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AddFilesToUserStorage, RemoveFilesFromUserStorage } from "services/storage/userStorageService";

interface FilesDto {
  keys: string[];
}

export async function addFilesController(
  request: FastifyRequest<{ Body: FilesDto; Params: { userId: string } }>,
  reply: FastifyReply
) {
  try {
    const { userId } = request.params;
    const { keys } = request.body;

    if (!keys || keys.length === 0) {
      return reply.status(400).send({ message: "No file keys provided" });
    }

    const storage = await AddFilesToUserStorage(userId, keys);
    return reply.send(storage);
  } catch (err) {
    return reply.status(500).send({ message: "Failed to add files", error: err });
  }
}

export async function removeFilesController(
  request: FastifyRequest<{ Body: FilesDto; Params: { userId: string } }>,
  reply: FastifyReply
) {
  try {
    const { userId } = request.params;
    const { keys } = request.body;

    if (!keys || keys.length === 0) {
      return reply.status(400).send({ message: "No file keys provided" });
    }

    const storage = await RemoveFilesFromUserStorage(userId, keys);
    return reply.send(storage);
  } catch (err) {
    return reply.status(500).send({ message: "Failed to remove files", error: err });
  }
}
