import { FastifyInstance } from 'fastify'
import { createRoomController, deleteRoomController } from 'controllers/roomController'

export default async function roomRoute(fastify: FastifyInstance) {
    
    fastify.post('/room', createRoomController)

    fastify.delete('/room', deleteRoomController)
}