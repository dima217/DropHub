// configuration.ts
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AppConfig } from './configuration.interface';

export const configuration = (): AppConfig => {
  const config = plainToInstance(AppConfig, {
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    postgres: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'myapp',
    },
    mongo: {
      uri: process.env.MONGO_URL || '',
    },
    s3: {
      endpoint: process.env.S3_ENDPOINT,
      bucket: process.env.S3_BUCKET,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
    swagger: {
      title: process.env.SWAGGER_TITLE,
      description: process.env.SWAGGER_DESCRIPTION,
      version: process.env.SWAGGER_VERSION,
      path: process.env.SWAGGER_PATH,
      enable: process.env.ENABLE_SWAGGER,
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
    },
    centrifugo: {
      apiUrl: process.env.CENTRIFUGO_API_URL,
      apiKey: process.env.CENTRIFUGO_API_KEY,
    },
  });

  const errors = validateSync(config);
  if (errors.length > 0) {
    throw new Error(`Config validation error: ${JSON.stringify(errors, null, 2)}`);
  }

  return config;
};
