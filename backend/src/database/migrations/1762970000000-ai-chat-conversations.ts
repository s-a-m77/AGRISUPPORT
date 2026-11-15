import { MigrationInterface, QueryRunner } from "typeorm";

export class AiChatConversations1762970000000 implements MigrationInterface {
  name = "AiChatConversations1762970000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ai_chat_messages" ADD COLUMN IF NOT EXISTS "conversation_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ai_chat_messages_owner_conversation" ON "ai_chat_messages" ("owner_id", "conversation_id", "created_at")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ai_chat_messages_owner_conversation"`);
    await queryRunner.query(
      `ALTER TABLE "ai_chat_messages" DROP COLUMN IF EXISTS "conversation_id"`,
    );
  }
}
