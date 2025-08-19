import { DeleteFileBody } from "controllers/fileController";
import { RoomModel } from "models/FileRoom";
import FileModel from "models/SharedFile";

export async function deleteFiles(params: DeleteFileBody) {
    const files = params.files;
    const updates = files.map(fileId => {
        FileModel.findByIdAndUpdate(
            fileId,
            { $set: { expiresAt: new Date() } },
            { new: true }
        ).exec()
    })

    const updateFiles = await Promise.all(updates);
    
    return updateFiles.filter(Boolean);
}

export async function getFilesByRoomsID(roomId: string) {
    const room = await RoomModel.findById(roomId).populate("files");
    if (!room) {
        throw new Error("Room hasn't been found");
    }
    const validFiles = room.files.filter(file => {
        return !file.expiresAt || file.expiresAt < new Date();
    })

    return validFiles;
}


