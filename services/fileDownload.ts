import { S3ReadStream } from "utils/S3ReadStream"

interface downloadInterface {
    bucket: string, 
    key: string, 
}

export async function downloadFile(params: downloadInterface) {
    const stream = new S3ReadStream(params.bucket, params.key)
}