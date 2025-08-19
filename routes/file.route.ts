import { FastifyInstance } from 'fastify'
import { deleteFileController } from 'controllers/fileController'
import { uploadController, uploadInitController, uploadMultipartInitController } from 'controllers/uploadController'
import { downloadFileController } from 'controllers/downloadController'

export default async function fileRoute(fastify: FastifyInstance) {

    fastify.post('/upload', uploadController)

    fastify.post('/upload/init', uploadInitController)

    fastify.post('/multipart/init', uploadMultipartInitController)

    fastify.post('/upload/complete', uploadController)

    fastify.post('/download', downloadFileController);

    fastify.patch('/file', deleteFileController)
}

