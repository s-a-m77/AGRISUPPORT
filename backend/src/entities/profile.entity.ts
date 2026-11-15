import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "./user.entity";

@Entity("profiles")
export class Profile {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ name: "display_name" })
  displayName!: string;

  @Column({ default: "English" })
  language!: string;

  @Column({ default: "farmer" })
  role!: string;

  @Column({ name: "onboarding_data", type: "jsonb", nullable: true })
  onboardingData!: {
    agriculturalRole: string;
    concern: string;
    region: string;
    zone: string;
    latitude: number | null;
    longitude: number | null;
    crop: string;
    farmSizeHectares: number | null;
  } | null;

  @Column({ name: "active_farm_id", type: "uuid", nullable: true })
  activeFarmId!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToOne(() => User, (user) => user.profile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id" })
  user!: User;
}
