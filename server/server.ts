import Fastify from 'fastify';
import mongoPlugin from '../plugins/mongo'
import multipart from '@fastify/multipart'
import uploadRoute from '../routes/upload.route';
import fastifyEnv from "@fastify/env";

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
app.register(uploadRoute);

app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
