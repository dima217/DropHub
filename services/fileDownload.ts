import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "config/s3";
import { S3ReadStream } from "utils/S3ReadStream"

interface downloadInterface {
    key: string, 
}

export async function getStream(params: downloadInterface) {
    const s3Reader = new S3ReadStream('drop-hub-storage', params.key);
    const stream = s3Reader.download();
    return stream;
}

export async function getDownloadLink(key: string) {
    const command = new GetObjectCommand({
      Bucket: 'drop-hub-storage',
      Key: key,
    });
  
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });
    return url;
}