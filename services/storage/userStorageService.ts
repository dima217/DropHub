import { UserStorageModel } from '../../models/UserStorage';
export async function AddFilesToUserStorage(userId: string, keys: string[]) {
    const storage = await UserStorageModel.findOneAndUpdate(
      { userId },
      { $addToSet: { files: { $each: keys } } }, // $addToSet adding unique
      { upsert: true, new: true }
    );
    return storage;
}
  
export async function RemoveFilesFromUserStorage(userId: string, keys: string[]) {
    const storage = await UserStorageModel.findOneAndUpdate(
      { userId },
      { $pull: { files: { $in: keys } } }, // $pull delete all coincidences
      { new: true }
    );
    return storage;
}