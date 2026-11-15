import "reflect-metadata";
import "dotenv/config";

import { DataSource } from "typeorm";

import { Alert } from "../entities/alert.entity";
import { Farm } from "../entities/farm.entity";
import { FarmObservation } from "../entities/farm-observation.entity";
import { Profile } from "../entities/profile.entity";
import { User } from "../entities/user.entity";
import { InitialSchema1710000000000 } from "./migrations/1710000000000-initial-schema";
import { FarmBoundary1762940000000 } from "./migrations/1762940000000-farm-boundary";
import { AiChatHistory1762950000000 } from "./migrations/1762950000000-ai-chat-history";
import { ProfileOnboarding1762960000000 } from "./migrations/1762960000000-profile-onboarding";
import { AiChatMessage } from "../entities/ai-chat-message.entity";
import { AiChatConversations1762970000000 } from "./migrations/1762970000000-ai-chat-conversations";

export default new DataSource({
  type: "postgres",
  host: process.env.DATABASE_HOST!,
  port: Number.parseInt(process.env.DATABASE_PORT!, 10),
  username: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  database: process.env.DATABASE_NAME!,
  entities: [Alert, Farm, FarmObservation, Profile, User, AiChatMessage],
  migrations: [
    InitialSchema1710000000000,
    FarmBoundary1762940000000,
    AiChatHistory1762950000000,
    ProfileOnboarding1762960000000,
    AiChatConversations1762970000000,
  ],
});
