import { FastifyInstance } from 'fastify'
import uploadController, { uploadRequestBody } from '../controllers/shareController'

export default async function uploadRoute(fastify: FastifyInstance) {
    fastify.post<{ Body: uploadRequestBody }>('/upload', uploadController)

}