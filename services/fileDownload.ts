import { S3DuplexStream } from "utils/S3InputStream"

interface downloadInterface {
    bucket: string, 
    key: string, 
}

export async function downloadFile(params: downloadInterface) {
    const stream = new S3DuplexStream(params.bucket, params.key)
}