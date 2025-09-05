import { DeleteFileBody } from "controllers/fileController";
import { RoomModel } from "models/FileRoom";
import FileModel from "models/SharedFile";

export async function deleteFiles(params: DeleteFileBody) {
    const fileIds = params.files;
    const updatedFiles = await Promise.all(
        fileIds.map(async (fileId) => {
          try {
            return await FileModel.findByIdAndUpdate(
              fileId,
              { $set: { expiresAt: new Date() } },
              { new: true }
            ).exec();
          } catch (err) {
            console.error(`Failed to expire file ${fileId}`, err);
            return null;
          }
        })
      );
    
    return updatedFiles.filter(Boolean);
}

export async function getFilesByRoomID(roomId: string) {
    const room = await RoomModel.findById(roomId).populate("files");
    if (!room) {
        throw new Error("Room hasn't been found");
    }
    const validFiles = room.files.filter(file => {
        return !file.expiresAt || file.expiresAt > new Date();
    })

    return validFiles;
}


