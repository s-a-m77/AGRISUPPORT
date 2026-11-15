import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async check() {
    try {
      await this.dataSource.query("SELECT 1");
    } catch {
      throw new ServiceUnavailableException({
        status: "unhealthy",
        database: "disconnected",
      });
    }

    return {
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    };
  }
}
