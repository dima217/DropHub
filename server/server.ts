import Fastify from 'fastify';
import mongoPlugin from '../plugins/mongo'
import multipart from '@fastify/multipart'
import fileRoute from '../routes/file.route';
import roomRoute from 'routes/room.route';
import fastifyEnv from "@fastify/env";
import "../services/jobs/cron_expireFile"

const schema = {
  type: 'object',
  required: ['S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'],
  properties: {
    S3_ENDPOINT: { type: 'string' },
    S3_ACCESS_KEY_ID: { type: 'string' },
    S3_SECRET_ACCESS_KEY: { type: 'string' }
  }
};

const options = {
  dotenv: true,
  schema
}

const app = Fastify({ logger: true });

app.register(fastifyEnv, options)
app.register(mongoPlugin);
app.register(multipart);
app.register(fileRoute);
app.register(roomRoute);

app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
