import { MigrationInterface, QueryRunner } from "typeorm";

export class ProfileOnboarding1762960000000 implements MigrationInterface {
  name = "ProfileOnboarding1762960000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "onboarding_data" jsonb`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN IF EXISTS "onboarding_data"`);
  }
}
