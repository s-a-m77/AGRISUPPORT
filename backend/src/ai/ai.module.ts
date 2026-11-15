import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { DataModule } from "../data/data.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AiChatMessage } from "../entities/ai-chat-message.entity";

@Module({
  imports: [AuthModule, DataModule, TypeOrmModule.forFeature([AiChatMessage])],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
