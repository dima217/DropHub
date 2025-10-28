import { IsString, IsInt, ValidateNested } from 'class-validator';

export class PostgresConfig {
  @IsInt()
  host: string;

  @IsInt()
  port: number;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  database: string;
}

export class SwaggerConfig {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  version: string;

  @IsString()
  path: string;

  @IsString()
  enable: string;
}

export class RedisConfig {
  @IsString()
  host: string;

  @IsInt()
  port: number;

  @IsString()
  password: string;
}

export class MongoConfig {
  @IsString()
  uri: string;
}

export class S3Config {
  @IsString()
  endpoint: string;

  @IsString()
  bucket: string;

  @IsString()
  accessKeyId: string;

  @IsString()
  secretAccessKey: string;
}

export class CentrifugoConfig {
  @IsString()
  apiUrl: string;

  @IsString()
  apiKey: string;
}

export class AppConfig {
  @IsString()
  environment: string;

  @IsInt()
  port: number;

  @ValidateNested()
  postgres: PostgresConfig;

  @ValidateNested()
  mongo: MongoConfig;

  @ValidateNested()
  s3: S3Config;

  @ValidateNested()
  swagger: SwaggerConfig;

  @ValidateNested()
  redis: RedisConfig;

  @ValidateNested()
  centrifugo: CentrifugoConfig;
}
