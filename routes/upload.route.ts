import fastify, { FastifyInstance } from 'fastify'
import { createRoomController, uploadController, UploadRequestBody } from '../controllers/shareController'

export default async function uploadRoute(fastify: FastifyInstance) {

    fastify.post('/upload', uploadController)

    fastify.post('/createRoom', createRoomController)
}

