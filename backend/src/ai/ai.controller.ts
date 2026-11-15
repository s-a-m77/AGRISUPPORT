import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AiService } from "./ai.service";
import type { Request } from "express";

type AuthenticatedRequest = Request & { user: { userId: string } };

class ChatMessageDto {
  @IsIn(["user", "model"])
  role!: "user" | "model";

  @IsString()
  @MinLength(1)
  text!: string;
}

class ChatDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];

  @IsOptional()
  @IsUUID()
  farmId?: string;

  @IsOptional()
  @IsIn(["gemini", "openrouter"])
  provider?: "gemini" | "openrouter";

  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsIn(["en", "am", "om"])
  responseLanguage?: "en" | "am" | "om";
}

@Controller("ai")
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get("history")
  history(@Req() req: AuthenticatedRequest, @Query("conversationId") conversationId?: string) {
    return this.ai.history(req.user.userId, conversationId);
  }

  @Post("chat")
  chat(@Req() req: AuthenticatedRequest, @Body() body: ChatDto) {
    return this.ai.chat(
      req.user.userId,
      body.messages,
      body.farmId,
      body.provider,
      body.conversationId,
      body.responseLanguage,
    );
  }
}
