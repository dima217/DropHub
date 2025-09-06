import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Room, RoomDocument } from "../schemas/room.schema";

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>
  ) {}

  async createRoom() {
    try {
      const newRoom = new this.roomModel({
        createdAt: new Date(),
        maxBytes: 5000,
      });

      const savedRoom = await newRoom.save();

      return {
        success: true,
        roomId: savedRoom.id.toString(),
      };
    } catch (err) {
      throw new HttpException(
        { error: "Could not create room", details: err?.message ?? err },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteRoom(roomId: string) {
    if (!roomId) {
      throw new HttpException(
        { error: "No roomId provided" },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const deletedRoom = await this.roomModel.findByIdAndDelete(roomId);

      if (!deletedRoom) {
        throw new HttpException(
          { error: "Room not found" },
          HttpStatus.NOT_FOUND
        );
      }

      return { message: "Room deleted successfully", roomId };
    } catch (err) {
      throw new HttpException(
        { error: "Failed to delete room", details: err?.message ?? err },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
