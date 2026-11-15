import { Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SatelliteService } from "./satellite.service";

type AuthenticatedRequest = Request & { user: { userId: string } };

@Controller("farms")
@UseGuards(JwtAuthGuard)
export class SatelliteController {
  constructor(private readonly satellite: SatelliteService) {}

  @Get(":farmId/satellite/layers")
  layers() { return this.satellite.layers(); }

  @Get(":farmId/satellite/summary")
  summary(@Req() req: AuthenticatedRequest, @Param("farmId") farmId: string) {
    return this.satellite.farmSummary(req.user.userId, farmId);
  }

  @Get(":farmId/satellite/history")
  history(@Req() req: AuthenticatedRequest, @Param("farmId") farmId: string, @Query("page") page?: string, @Query("limit") limit?: string) {
    return this.satellite.history(req.user.userId, farmId, Number(page ?? 1), Number(limit ?? 30));
  }

  @Get(":farmId/satellite/hls")
  hls(@Req() req: AuthenticatedRequest, @Param("farmId") farmId: string, @Query("start") start?: string, @Query("end") end?: string) {
    return this.satellite.hlsSearch(req.user.userId, farmId, start, end);
  }

  @Get(":farmId/satellite/modis")
  modis(@Req() req: AuthenticatedRequest, @Param("farmId") farmId: string) {
    return this.satellite.productHistory(req.user.userId, farmId, "modis");
  }

  @Get(":farmId/satellite/ndvi")
  ndvi(@Req() req: AuthenticatedRequest, @Param("farmId") farmId: string) {
    return this.satellite.sentinelNdvi(req.user.userId, farmId);
  }

  @Get(":farmId/satellite/gpm")
  gpm(@Req() req: AuthenticatedRequest, @Param("farmId") farmId: string) {
    return this.satellite.productHistory(req.user.userId, farmId, "gpm");
  }

  @Post(":farmId/satellite/refresh")
  refresh(@Req() req: AuthenticatedRequest, @Param("farmId") farmId: string) {
    return this.satellite.refresh(req.user.userId, farmId);
  }
}
