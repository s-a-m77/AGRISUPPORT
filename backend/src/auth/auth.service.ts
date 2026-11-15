import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { compare, hash } from "bcryptjs";
import { Repository } from "typeorm";

import { Profile } from "../entities/profile.entity";
import { User } from "../entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Profile) private readonly profiles: Repository<Profile>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(
    email: string,
    password: string,
    fullName: string,
    onboarding: {
      agriculturalRole?: string;
      role?: string;
      language?: string;
      region?: string;
      zone?: string;
      latitude?: number | null;
      longitude?: number | null;
      crop?: string;
      farmSizeHectares?: number | null;
      concern?: string;
    } = {},
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    if (await this.users.exists({ where: { email: normalizedEmail } })) {
      throw new ConflictException("An account with that email already exists.");
    }

    const user = await this.users.save(
      this.users.create({
        email: normalizedEmail,
        passwordHash: await hash(password, 12),
        fullName: fullName.trim(),
      }),
    );
    await this.profiles.save(
      this.profiles.create({
        id: user.id,
        displayName: user.fullName,
        language: onboarding.language ?? "English",
        role: onboarding.role ?? "farmer",
        onboardingData: {
          agriculturalRole: onboarding.agriculturalRole ?? "Smallholder Farmer",
          concern: onboarding.concern ?? "Drought & Water Stress",
          region: onboarding.region ?? "",
          zone: onboarding.zone ?? "",
          latitude: onboarding.latitude ?? null,
          longitude: onboarding.longitude ?? null,
          crop: onboarding.crop ?? "",
          farmSizeHectares: onboarding.farmSizeHectares ?? null,
        },
        activeFarmId: null,
      }),
    );
    return this.issueToken(user);
  }

  async signin(email: string, password: string) {
    const user = await this.users.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password.");
    }
    return this.issueToken(user);
  }

  async userFromToken(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("Invalid session.");
    return { id: user.id, email: user.email, fullName: user.fullName };
  }

  async updatePassword(userId: string, password: string) {
    await this.users.update(userId, { passwordHash: await hash(password, 12) });
    return { ok: true };
  }

  private async issueToken(user: User) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.config.getOrThrow<string>("jwtSecret"),
        expiresIn: "7d",
      },
    );
    return {
      accessToken,
      user: { id: user.id, email: user.email, fullName: user.fullName },
    };
  }
}
