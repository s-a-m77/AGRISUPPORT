import { MigrationInterface, QueryRunner } from "typeorm";

export class AiChatHistory1762950000000 implements MigrationInterface {
  name = "AiChatHistory1762950000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_chat_messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_id" uuid NOT NULL,
        "role" varchar NOT NULL,
        "text" text NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_chat_messages_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_chat_messages_owner"
          FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_ai_chat_messages_role" CHECK ("role" IN ('user', 'model'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ai_chat_messages_owner_created" ON "ai_chat_messages" ("owner_id", "created_at")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_ai_chat_messages_owner_created"`);
    await queryRunner.query(`DROP TABLE "ai_chat_messages"`);
  }
}
