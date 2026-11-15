import { MigrationInterface, QueryRunner } from "typeorm";

export class SatelliteObservationMetadata1762980000000 implements MigrationInterface {
  name = "SatelliteObservationMetadata1762980000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "farm_observations"
      ADD COLUMN IF NOT EXISTS "product_id" varchar,
      ADD COLUMN IF NOT EXISTS "retrieved_at" TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS "valid_pixel_count" integer,
      ADD COLUMN IF NOT EXISTS "quality_status" varchar,
      ADD COLUMN IF NOT EXISTS "spatial_resolution" varchar,
      ADD COLUMN IF NOT EXISTS "metadata" jsonb`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_observations_farm_product_date"
      ON "farm_observations" ("farm_id", "product_id", "observed_on")
      WHERE "product_id" IS NOT NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_observations_farm_product_date"`);
    await queryRunner.query(`ALTER TABLE "farm_observations"
      DROP COLUMN IF EXISTS "metadata",
      DROP COLUMN IF EXISTS "spatial_resolution",
      DROP COLUMN IF EXISTS "quality_status",
      DROP COLUMN IF EXISTS "valid_pixel_count",
      DROP COLUMN IF EXISTS "retrieved_at",
      DROP COLUMN IF EXISTS "product_id"`);
  }
}
