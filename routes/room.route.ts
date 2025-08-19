import { FastifyInstance } from 'fastify'
import { createRoomController } from 'controllers/roomController'

export default async function roomRoute(fastify: FastifyInstance) {
    fastify.post('/createRoom', createRoomController)
}