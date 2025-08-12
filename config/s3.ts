import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";

const agent = new https.Agent({
    maxSockets: 50,
});

const s3 = new S3Client({
    region: "fra3",
    endpoint: "https://u2o3.fra3.idrivee2-59.com",
    forcePathStyle: true,
    credentials: {
        accessKeyId: "UQ5ryjYyvPwG5nmMZ1Rk",
        secretAccessKey: "DhYvB77CU1tjyAed5saI1p9Rg5F1D8mmXVHcHjHL",
    },
    requestHandler: new NodeHttpHandler({
        requestTimeout: 5_000,
        httpsAgent: agent,
    }),
});

async function listBuckets() {
    try {
        const data = await s3.send(new ListBucketsCommand({}));
        console.log("Buckets:", data.Buckets);
    } catch (error) {
        console.error("Ошибка:", error);
    }
}

export default s3;
