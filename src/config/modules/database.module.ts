import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../configuration.interface';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) => {
        const postgres = config.get('postgres');
        if (!postgres) throw new Error('Postgres config missing!');
        return {
          type: 'postgres',
          host: postgres.host,
          port: postgres.port,
          username: postgres.username,
          password: postgres.password,
          database: postgres.database,
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) => {
        const mongoUri = config.get<string>('mongo');
        if (!mongoUri) throw new Error('Mongo URI missing!');
        return { uri: mongoUri };
      },
    }),
  ],
  exports: [TypeOrmModule, MongooseModule],
})
export class DatabaseModule {}
