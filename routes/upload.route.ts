import fastify, { FastifyInstance } from 'fastify'
import { createRoomController, uploadController, uploadInitController, uploadMultipartInitController, UploadRequestBody } from '../controllers/shareController'

export default async function uploadRoute(fastify: FastifyInstance) {

    fastify.post('/upload', uploadController)

    fastify.post('/upload/init', uploadInitController)

    fastify.post('/multipart/init', uploadMultipartInitController)

    fastify.post('/upload/complete', uploadController)

    fastify.post('/createRoom', createRoomController)
}

