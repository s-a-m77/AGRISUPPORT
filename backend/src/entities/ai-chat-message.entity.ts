import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("ai_chat_messages")
@Index(["ownerId", "createdAt"])
export class AiChatMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "owner_id", type: "uuid" })
  ownerId!: string;

  @Column({ name: "conversation_id", type: "uuid", nullable: true })
  conversationId!: string | null;

  @Column({ type: "varchar" })
  role!: "user" | "model";

  @Column({ type: "text" })
  text!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
