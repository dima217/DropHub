import { S3ReadStream } from "utils/S3ReadStream"

interface downloadInterface {
    key: string, 
}

export async function getStream(params: downloadInterface) {
    const s3Reader = new S3ReadStream('drop-hub-storage', params.key);
    const stream = s3Reader.download();
    return stream;
}