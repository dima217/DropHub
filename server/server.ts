import Fastify from 'fastify';
import mongoPlugin from '../plugins/mongo'
import multipart from '@fastify/multipart'

const app = Fastify({ logger: true });

app.register(mongoPlugin);
app.register(multipart);

app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening at ${address}`);
});
