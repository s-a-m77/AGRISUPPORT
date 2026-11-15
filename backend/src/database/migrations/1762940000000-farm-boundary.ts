import { MigrationInterface, QueryRunner } from "typeorm";

export class FarmBoundary1762940000000 implements MigrationInterface {
  name = "FarmBoundary1762940000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "farms"
      ADD COLUMN IF NOT EXISTS "description" text NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS "farm_type" varchar NOT NULL DEFAULT 'Mixed farming',
      ADD COLUMN IF NOT EXISTS "ownership_info" text,
      ADD COLUMN IF NOT EXISTS "mapping_method" varchar NOT NULL DEFAULT 'manual',
      ADD COLUMN IF NOT EXISTS "boundary_geojson" jsonb,
      ADD COLUMN IF NOT EXISTS "area_square_meters" numeric,
      ADD COLUMN IF NOT EXISTS "perimeter_meters" numeric,
      ADD COLUMN IF NOT EXISTS "mapping_timestamp" timestamptz`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "farms"
      DROP COLUMN "mapping_timestamp",
      DROP COLUMN "perimeter_meters",
      DROP COLUMN "area_square_meters",
      DROP COLUMN "boundary_geojson",
      DROP COLUMN "mapping_method",
      DROP COLUMN "ownership_info",
      DROP COLUMN "farm_type",
      DROP COLUMN "description"`);
  }
}
