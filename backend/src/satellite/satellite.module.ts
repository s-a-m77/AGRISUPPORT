import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "../auth/auth.module";
import { Farm } from "../entities/farm.entity";
import { FarmObservation } from "../entities/farm-observation.entity";
import { SatelliteController } from "./satellite.controller";
import { SatelliteService } from "./satellite.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Farm, FarmObservation])],
  controllers: [SatelliteController],
  providers: [SatelliteService],
})
export class SatelliteModule {}
