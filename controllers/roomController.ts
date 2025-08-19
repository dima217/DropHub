import { FastifyReply, FastifyRequest } from "fastify";
import { RoomModel } from "models/FileRoom";

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