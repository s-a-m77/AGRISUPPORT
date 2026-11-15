import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { FarmObservation } from "./farm-observation.entity";
import { User } from "./user.entity";

@Entity("farms")
export class Farm {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "owner_id", type: "uuid" })
  ownerId!: string;

  @Column()
  name!: string;

  @Column()
  region!: string;

  @Column()
  zone!: string;

  @Column()
  woreda!: string;

  @Column()
  crop!: string;

  @Column({ name: "size_hectares", type: "numeric" })
  sizeHectares!: number;

  @Column()
  irrigation!: string;

  @Column({ name: "planting_date", type: "date", nullable: true })
  plantingDate!: string | null;

  @Column({ type: "numeric", default: 0 })
  ndvi!: number;

  @Column({ name: "ndvi_change", default: "0%" })
  ndviChange!: string;

  @Column({ name: "health_status", default: "Healthy" })
  healthStatus!: string;

  @Column({ default: "Unknown" })
  moisture!: string;

  @Column({ name: "drought_risk", default: "Low" })
  droughtRisk!: string;

  @Column({ type: "numeric", nullable: true })
  latitude!: number | null;

  @Column({ type: "numeric", nullable: true })
  longitude!: number | null;

  @Column({ name: "description", type: "text", default: "" })
  description!: string;

  @Column({ name: "farm_type", default: "Mixed farming" })
  farmType!: string;

  @Column({ name: "ownership_info", type: "text", nullable: true })
  ownershipInfo!: string | null;

  @Column({ name: "mapping_method", default: "manual" })
  mappingMethod!: "gps" | "manual";

  @Column({ name: "boundary_geojson", type: "jsonb", nullable: true })
  boundaryGeojson!: object | null;

  @Column({ name: "area_square_meters", type: "numeric", nullable: true })
  areaSquareMeters!: number | null;

  @Column({ name: "perimeter_meters", type: "numeric", nullable: true })
  perimeterMeters!: number | null;

  @Column({ name: "mapping_timestamp", type: "timestamptz", nullable: true })
  mappingTimestamp!: Date | null;

  @Column({ name: "last_observation", default: "Not available" })
  lastObservation!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => FarmObservation, (observation) => observation.farm)
  observations!: FarmObservation[];

  @ManyToOne(() => User, (user) => user.farms, { onDelete: "CASCADE" })
  @JoinColumn({ name: "owner_id" })
  owner!: User;
}
