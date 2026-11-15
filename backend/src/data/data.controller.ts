import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { IsIn, IsNumber, IsObject, IsOptional, IsString, Max, Min } from "class-validator";
import type { Request } from "express";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DataService } from "./data.service";

type AuthenticatedRequest = Request & { user: { userId: string } };
const AGRICULTURAL_ROLES = [
  "farmer",
  "agricultural_expert",
  "climate_researcher",
  "cooperative_leader",
] as const;

class ProfileDto {
  @IsString()
  displayName!: string;

  @IsString()
  language!: string;

  @IsIn(AGRICULTURAL_ROLES)
  role!: string;
}

class FarmDto {
  @IsString() name!: string;
  @IsString() crop!: string;
  @IsString() region!: string;
  @IsString() zone!: string;
  @IsString() woreda!: string;
  @IsNumber() @Min(0) @Max(100000) sizeHectares!: number;
  @IsOptional() @IsString() plantingDate?: string;
  @IsString() irrigation!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() farmType?: string;
  @IsOptional() @IsString() ownershipInfo?: string;
  @IsOptional() @IsIn(["gps", "manual"]) mappingMethod?: "gps" | "manual";
  @IsOptional() @IsObject() boundaryGeojson?: object;
  @IsOptional() @IsNumber() @Min(-90) @Max(90) latitude?: number;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) longitude?: number;
}

@Controller("data")
@UseGuards(JwtAuthGuard)
export class DataController {
  constructor(private readonly data: DataService) {}

  @Get("profile")
  profile(@Req() req: AuthenticatedRequest) {
    return this.data.profile(req.user.userId);
  }

  @Patch("profile")
  saveProfile(@Req() req: AuthenticatedRequest, @Body() body: ProfileDto) {
    return this.data.saveProfile(req.user.userId, body);
  }

  @Post("profile/active-farm/:farmId")
  chooseFarm(@Req() req: AuthenticatedRequest, @Param("farmId") farmId: string) {
    return this.data.chooseFarm(req.user.userId, farmId);
  }

  @Get("farms")
  farms(@Req() req: AuthenticatedRequest) {
    return this.data.listFarms(req.user.userId);
  }

  @Post("farms")
  addFarm(@Req() req: AuthenticatedRequest, @Body() body: FarmDto) {
    return this.data.addFarm(req.user.userId, body);
  }

  @Patch("farms/:id")
  editFarm(@Req() req: AuthenticatedRequest, @Param("id") id: string, @Body() body: FarmDto) {
    return this.data.editFarm(req.user.userId, id, body);
  }

  @Delete("farms/:id")
  removeFarm(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.data.removeFarm(req.user.userId, id);
  }

  @Get("farms/:id/area")
  farmArea(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.data.farmArea(req.user.userId, id);
  }

  @Get("farms/:id/power")
  farmPower(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.data.farmPower(req.user.userId, id);
  }

  @Get("dashboard-telemetry")
  dashboardTelemetry(@Req() req: AuthenticatedRequest, @Query("farmId") farmId?: string) {
    return this.data.dashboardTelemetry(req.user.userId, farmId);
  }

  @Get("alerts")
  alerts(@Req() req: AuthenticatedRequest) {
    return this.data.listAlerts(req.user.userId);
  }

  @Patch("alerts/:id/read")
  markAlertRead(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.data.markAlertRead(req.user.userId, id);
  }

  @Patch("alerts/read-all")
  markAllAlertsRead(@Req() req: AuthenticatedRequest) {
    return this.data.markAllAlertsRead(req.user.userId);
  }
}
