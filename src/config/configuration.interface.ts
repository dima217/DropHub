import { IsString, IsInt, ValidateNested } from "class-validator";

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

export class AppConfig {
  @IsString()
  environment: string;

  @IsInt()
  port: number;

  @ValidateNested()
  postgres: PostgresConfig;

  @ValidateNested()
  swagger: SwaggerConfig;

  @ValidateNested()
  redis: RedisConfig;
}