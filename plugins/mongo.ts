import fp from 'fastify-plugin'
import mongoose from 'mongoose'

export default fp(async function (fastify, opts) {
    const uri = process.env.MONGO_URI
    if (!uri) {
      fastify.log.error('MONGO_URI is not defined')
      process.exit(1)
    }

    try {
      await mongoose.connect(uri)
      fastify.log.info('MongoDB connected')
    } catch (err) {
      fastify.log.error(err)
      process.exit(1)
    }
  
    fastify.addHook('onClose', async () => {
      await mongoose.disconnect()
      fastify.log.info('MongoDB disconnected')
    })
})
