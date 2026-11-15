import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1710000000000 implements MigrationInterface {
  name = "InitialSchema1710000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Development synchronization may have created the baseline schema before
    // migrations were enabled. Preserve that existing schema and record this
    // migration as applied.
    if (await queryRunner.hasTable("users")) return;

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" varchar NOT NULL,
        "password_hash" varchar NOT NULL,
        "full_name" varchar NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "farms" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_id" uuid NOT NULL,
        "name" varchar NOT NULL,
        "region" varchar NOT NULL,
        "zone" varchar NOT NULL,
        "woreda" varchar NOT NULL,
        "crop" varchar NOT NULL,
        "size_hectares" numeric NOT NULL,
        "irrigation" varchar NOT NULL,
        "planting_date" date,
        "ndvi" numeric NOT NULL DEFAULT 0,
        "ndvi_change" varchar NOT NULL DEFAULT '0%',
        "health_status" varchar NOT NULL DEFAULT 'Healthy',
        "moisture" varchar NOT NULL DEFAULT 'Unknown',
        "drought_risk" varchar NOT NULL DEFAULT 'Low',
        "latitude" numeric,
        "longitude" numeric,
        "last_observation" varchar NOT NULL DEFAULT 'Not available',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_farms_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_farms_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "profiles" (
        "id" uuid NOT NULL,
        "display_name" varchar NOT NULL,
        "language" varchar NOT NULL DEFAULT 'English',
        "role" varchar NOT NULL DEFAULT 'farmer',
        "active_farm_id" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_profiles_user" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_profiles_active_farm" FOREIGN KEY ("active_farm_id") REFERENCES "farms"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "alerts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_id" uuid NOT NULL,
        "title" varchar NOT NULL,
        "farm_name" varchar NOT NULL,
        "severity" varchar NOT NULL,
        "category" varchar NOT NULL,
        "evidence" varchar NOT NULL,
        "recommendation" varchar NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "occurred_on" date NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alerts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alerts_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "farm_observations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "farm_id" uuid NOT NULL,
        "observed_on" date NOT NULL,
        "ndvi" numeric,
        "ndvi_change" varchar,
        "moisture_percent" numeric,
        "rainfall_mm" numeric,
        "surface_temperature_c" numeric,
        "source" varchar NOT NULL DEFAULT 'manual',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_farm_observations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_observations_farm" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_farms_owner_id" ON "farms" ("owner_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_alerts_owner_id" ON "alerts" ("owner_id")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_observations_farm_date" ON "farm_observations" ("farm_id", "observed_on")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_observations_farm_date"`);
    await queryRunner.query(`DROP INDEX "IDX_alerts_owner_id"`);
    await queryRunner.query(`DROP INDEX "IDX_farms_owner_id"`);
    await queryRunner.query(`DROP TABLE "farm_observations"`);
    await queryRunner.query(`DROP TABLE "alerts"`);
    await queryRunner.query(`DROP TABLE "profiles"`);
    await queryRunner.query(`DROP TABLE "farms"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
