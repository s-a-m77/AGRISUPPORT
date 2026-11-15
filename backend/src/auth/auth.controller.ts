import { Body, Controller, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { IsEmail, IsIn, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import type { Request } from "express";

import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsOptional()
  @IsString()
  agriculturalRole?: string;

  @IsOptional()
  @IsIn(["farmer", "agricultural_expert", "climate_researcher", "cooperative_leader"])
  role?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  longitude?: number | null;

  @IsOptional()
  @IsString()
  crop?: string;

  @IsOptional()
  @IsNumber()
  farmSizeHectares?: number | null;

  @IsOptional()
  @IsString()
  concern?: string;
}

class SigninDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class UpdatePasswordDto {
  @IsString()
  @MinLength(8)
  password!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  signup(@Body() body: SignupDto) {
    return this.authService.signup(body.email, body.password, body.fullName, body);
  }

  @Post("signin")
  signin(@Body() body: SigninDto) {
    return this.authService.signin(body.email, body.password);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() request: Request & { user: { userId: string } }) {
    return this.authService.userFromToken(request.user.userId);
  }

  @Patch("password")
  @UseGuards(JwtAuthGuard)
  updatePassword(
    @Req() request: Request & { user: { userId: string } },
    @Body() body: UpdatePasswordDto,
  ) {
    return this.authService.updatePassword(request.user.userId, body.password);
  }
}
