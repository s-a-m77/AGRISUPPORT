import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import configuration from "./configuration";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { DataModule } from "./data/data.module";
import { Alert } from "./entities/alert.entity";
import { Farm } from "./entities/farm.entity";
import { FarmObservation } from "./entities/farm-observation.entity";
import { Profile } from "./entities/profile.entity";
import { User } from "./entities/user.entity";
import { InitialSchema1710000000000 } from "./database/migrations/1710000000000-initial-schema";
import { AiModule } from "./ai/ai.module";
import { AiChatMessage } from "./entities/ai-chat-message.entity";
import { AiChatHistory1762950000000 } from "./database/migrations/1762950000000-ai-chat-history";
import { FarmBoundary1762940000000 } from "./database/migrations/1762940000000-farm-boundary";
import { ProfileOnboarding1762960000000 } from "./database/migrations/1762960000000-profile-onboarding";
import { AiChatConversations1762970000000 } from "./database/migrations/1762970000000-ai-chat-conversations";
import { SatelliteObservationMetadata1762980000000 } from "./database/migrations/1762980000000-satellite-observation-metadata";
import { SatelliteModule } from "./satellite/satellite.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [".env"],
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.getOrThrow<string>("database.host"),
        port: config.getOrThrow<number>("database.port"),
        username: config.getOrThrow<string>("database.username"),
        password: config.getOrThrow<string>("database.password"),
        database: config.getOrThrow<string>("database.name"),
        entities: [Alert, Farm, FarmObservation, Profile, User, AiChatMessage],
        migrations: [
          InitialSchema1710000000000,
          FarmBoundary1762940000000,
          AiChatHistory1762950000000,
          ProfileOnboarding1762960000000,
          AiChatConversations1762970000000,
          SatelliteObservationMetadata1762980000000,
        ],
        migrationsRun: config.get<string>("NODE_ENV") === "production",
        synchronize: config.get<string>("NODE_ENV") !== "production",
      }),
    }),
    HealthModule,
    AuthModule,
    DataModule,
    AiModule,
    SatelliteModule,
  ],
})
export class AppModule {}
