// @ts-ignore
import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https"

const agent = new https.Agent({
    maxSockets: 50
})

const s3 = new S3Client({
    region: 'fra3',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
    },
    requestHandler: new NodeHttpHandler({
        requestTimeout: 5_000,
        httpsAgent: agent
    })
})

export default s3;