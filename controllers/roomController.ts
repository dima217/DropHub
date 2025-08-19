import { DeleteRoomBody } from "constants/interfaces";
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

export async function deleteRoomController(req: FastifyRequest<{Body: DeleteRoomBody}>, reply: FastifyReply) {
    try {
        const roomId = req.body;
        if (!roomId) {
            return reply.status(400).send({ error: "No roomId provided"})
        }
        const deleteRoom = await RoomModel.findByIdAndDelete(roomId)

        if (!deleteRoom) {
            return reply.status(404).send({error: "Room not"})
        }
        reply.status(200).send({ message: "Room deleted successfully", roomId });
    } catch(err) {
        if (err instanceof Error)
        reply.status(500).send({ error: "Failed to delete room", details: err.message });
    }
}