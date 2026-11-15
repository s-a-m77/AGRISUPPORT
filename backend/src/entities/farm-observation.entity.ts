import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Farm } from "./farm.entity";

@Entity("farm_observations")
@Index(["farmId", "observedOn"])
@Index(["farmId", "productId", "observedOn"], { unique: true })
export class FarmObservation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "farm_id", type: "uuid" })
  farmId!: string;

  @Column({ name: "observed_on", type: "date" })
  observedOn!: string;

  @Column({ type: "numeric", nullable: true })
  ndvi!: number | null;

  @Column({ name: "ndvi_change", type: "varchar", nullable: true })
  ndviChange!: string | null;

  @Column({ name: "moisture_percent", type: "numeric", nullable: true })
  moisturePercent!: number | null;

  @Column({ name: "rainfall_mm", type: "numeric", nullable: true })
  rainfallMm!: number | null;

  @Column({ name: "surface_temperature_c", type: "numeric", nullable: true })
  surfaceTemperatureC!: number | null;

  @Column({ name: "source", default: "manual" })
  source!: string;

  @Column({ name: "product_id", type: "varchar", nullable: true })
  productId!: string | null;

  @Column({ name: "retrieved_at", type: "timestamptz", nullable: true })
  retrievedAt!: Date | null;

  @Column({ name: "valid_pixel_count", type: "integer", nullable: true })
  validPixelCount!: number | null;

  @Column({ name: "quality_status", type: "varchar", nullable: true })
  qualityStatus!: string | null;

  @Column({ name: "spatial_resolution", type: "varchar", nullable: true })
  spatialResolution!: string | null;

  @Column({ name: "metadata", type: "jsonb", nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => Farm, (farm) => farm.observations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "farm_id" })
  farm!: Farm;
}
