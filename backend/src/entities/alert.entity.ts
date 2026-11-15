import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "./user.entity";

@Entity("alerts")
export class Alert {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "owner_id", type: "uuid" })
  ownerId!: string;

  @Column()
  title!: string;

  @Column({ name: "farm_name" })
  farmName!: string;

  @Column()
  severity!: string;

  @Column()
  category!: string;

  @Column()
  evidence!: string;

  @Column()
  recommendation!: string;

  @Column({ name: "is_read", default: false })
  isRead!: boolean;

  @Column({ name: "occurred_on", type: "date" })
  occurredOn!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.alerts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "owner_id" })
  owner!: User;
}
