import { FastifyInstance } from 'fastify'
import { deleteFileController } from 'controllers/fileController'
import { uploadController, uploadInitController, uploadMultipartInitController } from 'controllers/fileUploadController'
import { downloadFileController } from 'controllers/fileDownloadController'
import { getDownloadLink } from 'services/file/fileDownload'

export default async function fileRoute(fastify: FastifyInstance) {

    fastify.post('/upload', uploadController)

    fastify.post('/upload/init', uploadInitController)

    fastify.post('/multipart/init', uploadMultipartInitController)

    fastify.post('/upload/complete', uploadController)

    fastify.post('/download', downloadFileController);

    fastify.patch('/file', deleteFileController)

    fastify.post("/download-link", async (req, reply) => {
        const { key } = req.body as { key: string };
        const url = await getDownloadLink(key);
        return { url };
    });
}

