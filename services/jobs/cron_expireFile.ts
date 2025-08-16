import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "config/s3";
import FileModel from "models/SharedFile";
import cron from "node-cron";

cron.schedule('*/5 * * * *', async () => {
    const expiredFiles = await FileModel.find({expiresAt : {$lte: new Date()}}) // $lte - filter to search "less or equal"

    for (const file of expiredFiles) {
        try {
            await s3.send(new DeleteObjectCommand({
                Bucket: "drop-hub-file",
                Key: file.storedName,
            }));
            
            await file.deleteOne();
        } catch(err) {
            console.error("Error while deleting", err)
        }
    }
})