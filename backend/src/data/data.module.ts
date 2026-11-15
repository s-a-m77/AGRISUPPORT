import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "../auth/auth.module";
import { Alert } from "../entities/alert.entity";
import { Farm } from "../entities/farm.entity";
import { FarmObservation } from "../entities/farm-observation.entity";
import { Profile } from "../entities/profile.entity";
import { DataController } from "./data.controller";
import { DataService } from "./data.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Alert, Farm, FarmObservation, Profile])],
  controllers: [DataController],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}
