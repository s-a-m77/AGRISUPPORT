import {
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Alert } from "../entities/alert.entity";
import { Farm } from "../entities/farm.entity";
import { FarmObservation } from "../entities/farm-observation.entity";
import { Profile } from "../entities/profile.entity";
import { polygonCentroid, polygonMetrics, validatePolygon, type GeoJsonPolygon } from "./geo";

type PowerDay = {
  date: string;
  temperatureC: number | null;
  maximumTemperatureC: number | null;
  minimumTemperatureC: number | null;
  precipitationMm: number | null;
  relativeHumidity: number | null;
  solarRadiation: number | null;
  windSpeed: number | null;
  transpirationMm: number | null;
  soilWetness: number | null;
};

type PowerResponse = {
  farmId: string;
  farmName: string;
  coordinates: {
    latitude: number;
    longitude: number;
    source: "boundary-centroid" | "farm-location";
  };

  source: string;
  timeStandard: string;
  units: {
    temperatureC: string;
    maximumTemperatureC: string;
    minimumTemperatureC: string;
    precipitationMm: string;
    relativeHumidity: string;
    solarRadiation: string;
    windSpeed: string;
    transpirationMm: string;
    soilWetness: string;
  };
  days: PowerDay[];
  fetchedAt: string;
};

export type DashboardTelemetry = {
  coordinates: { latitude: number; longitude: number };
  rainfallMm: number;
  soilMoisturePercent: number | null;
  temperatureC: number | null;
  rainfallTrend: string;
  soilMoistureTrend: string;
  source: "NASA POWER";
};

type PowerApiResponse = {
  geometry?: { coordinates?: [number, number, number?] };
  properties?: {
    parameter?: Record<string, Record<string, number>>;
  };
  header?: { sources?: string[]; time_standard?: string };
  parameters?: Record<string, { units?: string }>;
};

const POWER_CACHE_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class DataService {
  private readonly powerCache = new Map<string, { expiresAt: number; value: PowerResponse }>();

  constructor(
    @InjectRepository(Alert) private readonly alerts: Repository<Alert>,
    @InjectRepository(Farm) private readonly farms: Repository<Farm>,
    @InjectRepository(FarmObservation) private readonly observations: Repository<FarmObservation>,
    @InjectRepository(Profile) private readonly profiles: Repository<Profile>,
  ) {}

  async profile(userId: string) {
    const profile = await this.profiles.findOne({ where: { id: userId } });
    if (!profile) throw new NotFoundException("Profile not found.");
    return {
      displayName: profile.displayName,
      language: profile.language,
      role: profile.role,
      activeFarmId: profile.activeFarmId,
    };
  }

  async saveProfile(
    userId: string,
    input: { displayName: string; language: string; role: string },
  ) {
    const profile = await this.profiles.preload({
      id: userId,
      ...input,
    });
    if (!profile) throw new NotFoundException("Profile not found.");
    return this.profiles.save(profile);
  }

  async chooseFarm(userId: string, farmId: string) {
    const farm = await this.farms.findOne({ where: { id: farmId, ownerId: userId } });
    if (!farm) throw new NotFoundException("That plot is not in your account.");
    await this.profiles.update(userId, { activeFarmId: farmId });
    return { ok: true };
  }

  async listFarms(userId: string) {
    const farms = await this.farms.find({ where: { ownerId: userId }, order: { createdAt: "ASC" } });
    if (farms.length === 0) return farms;
    const latestObservations = await this.observations
      .createQueryBuilder("observation")
      .distinctOn(["observation.farmId"])
      .where("observation.farmId IN (:...farmIds)", { farmIds: farms.map((farm) => farm.id) })
      .andWhere("observation.ndvi IS NOT NULL")
      .orderBy("observation.farmId", "ASC")
      .addOrderBy("observation.observedOn", "DESC")
      .getMany();
    const observationByFarm = new Map(
      latestObservations.map((observation) => [observation.farmId, observation]),
    );

    return farms.map((farm) => {
      const observation = observationByFarm.get(farm.id);
      if (!observation) return farm;
      farm.ndvi = Number(observation.ndvi);
      farm.ndviChange = observation.ndviChange ?? farm.ndviChange;
      farm.lastObservation = observation.observedOn;
      return farm;
    });
  }

  async farmObservations(userId: string, farmId: string) {
    const farm = await this.farms.findOne({ where: { id: farmId, ownerId: userId } });
    if (!farm) throw new NotFoundException("That plot is not in your account.");
    return this.observations.find({
      where: { farmId },
      order: { observedOn: "DESC" },
      take: 100,
    });
  }

  async addFarm(userId: string, input: Partial<Farm>) {
    return this.farms.save(this.farms.create(await this.prepareFarm(userId, input)));
  }

  async editFarm(userId: string, farmId: string, input: Partial<Farm>) {
    const farm = await this.farms.preload({
      id: farmId,
      ...(await this.prepareFarm(userId, input)),
    });
    if (!farm) throw new NotFoundException("That plot is not in your account.");
    return this.farms.save(farm);
  }

  private async prepareFarm(ownerId: string, input: Partial<Farm>) {
    if (!input.boundaryGeojson) return { ...input, ownerId };
    const boundary = validatePolygon(input.boundaryGeojson);
    const metrics = polygonMetrics(boundary);
    return {
      ...input,
      ownerId,
      boundaryGeojson: boundary,
      sizeHectares: metrics.areaHectares,
      areaSquareMeters: metrics.areaSquareMeters,
      perimeterMeters: metrics.perimeterMeters,
      mappingTimestamp: new Date(),
    };
  }

  async removeFarm(userId: string, farmId: string) {
    const farm = await this.farms.findOne({ where: { id: farmId, ownerId: userId } });
    if (!farm) throw new NotFoundException("That plot is not in your account.");
    await this.farms.remove(farm);
    const remaining = await this.farms.findOne({
      where: { ownerId: userId },
      order: { createdAt: "ASC" },
    });
    const profile = await this.profiles.findOne({ where: { id: userId } });
    if (profile?.activeFarmId === farmId) {
      await this.profiles.update(userId, { activeFarmId: remaining?.id ?? null });
    }

    return { ok: true, activeFarmId: remaining?.id ?? null };
  }

  async farmArea(userId: string, farmId: string) {
    const farm = await this.farms.findOne({ where: { id: farmId, ownerId: userId } });
    if (!farm) throw new NotFoundException("That plot is not in your account.");
    if (!farm.boundaryGeojson || farm.areaSquareMeters === null || farm.perimeterMeters === null) {
      throw new BadRequestException("This farm does not have a mapped boundary.");
    }
    return {
      areaSquareMeters: Number(farm.areaSquareMeters),
      areaHectares: Number(farm.sizeHectares),
      perimeterMeters: Number(farm.perimeterMeters),
      perimeterKilometers: Number(farm.perimeterMeters) / 1000,
    };
  }

  async farmPower(userId: string, farmId: string): Promise<PowerResponse> {
    const farm = await this.farms.findOne({ where: { id: farmId, ownerId: userId } });
    if (!farm) throw new NotFoundException("That plot is not in your account.");

    const location = this.powerLocation(farm);
    const today = new Date();
    const end = this.formatDate(today);
    const startDate = new Date(today);
    startDate.setUTCDate(today.getUTCDate() - 29);
    const start = this.formatDate(startDate);
    const cacheKey = `${farm.id}:${location.latitude.toFixed(5)}:${location.longitude.toFixed(5)}:${start}:${end}`;
    const cached = this.powerCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const params = new URLSearchParams({
      parameters:
        "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN,WS2M,EVPTRNS,GWETTOP",
      community: "AG",
      longitude: String(location.longitude),
      latitude: String(location.latitude),
      start,
      end,
      format: "JSON",
      "time-standard": "UTC",
    });

    let response: Response;
    try {
      response = await fetch(`https://power.larc.nasa.gov/api/temporal/daily/point?${params}`);
    } catch {
      throw new GatewayTimeoutException("NASA POWER could not be reached.");
    }

    if (!response.ok) {
      throw new GatewayTimeoutException(`NASA POWER returned HTTP ${response.status}.`);
    }

    const payload = (await response.json()) as PowerApiResponse;
    const parameters = payload.properties?.parameter;
    if (!parameters?.T2M || !parameters.PRECTOTCORR) {
      throw new BadRequestException("NASA POWER returned an incomplete climate response.");
    }

    const dates = [...new Set(Object.keys(parameters.T2M))].sort();
    const value: PowerResponse = {
      farmId: farm.id,
      farmName: farm.name,
      coordinates: location,
      source: payload.header?.sources?.join(", ") || "NASA POWER",
      timeStandard: payload.header?.time_standard || "UTC",
      units: {
        temperatureC: payload.parameters?.T2M?.units || "C",
        maximumTemperatureC: payload.parameters?.T2M_MAX?.units || "C",
        minimumTemperatureC: payload.parameters?.T2M_MIN?.units || "C",
        precipitationMm: payload.parameters?.PRECTOTCORR?.units || "mm/day",
        relativeHumidity: payload.parameters?.RH2M?.units || "%",
        solarRadiation: payload.parameters?.ALLSKY_SFC_SW_DWN?.units || "kWh/m^2/day",
        windSpeed: payload.parameters?.WS2M?.units || "m/s",
        transpirationMm: payload.parameters?.EVPTRNS?.units || "mm/day",
        soilWetness: payload.parameters?.GWETTOP?.units || "1",
      },
      days: dates.map((date) => ({
        date,
        temperatureC: this.powerValue(parameters.T2M?.[date]),
        maximumTemperatureC: this.powerValue(parameters.T2M_MAX?.[date]),
        minimumTemperatureC: this.powerValue(parameters.T2M_MIN?.[date]),
        precipitationMm: this.powerValue(parameters.PRECTOTCORR?.[date]),
        relativeHumidity: this.powerValue(parameters.RH2M?.[date]),
        solarRadiation: this.powerValue(parameters.ALLSKY_SFC_SW_DWN?.[date]),
        windSpeed: this.powerValue(parameters.WS2M?.[date]),
        transpirationMm: this.powerValue(parameters.EVPTRNS?.[date]),
        soilWetness: this.powerValue(parameters.GWETTOP?.[date]),
      })),
      fetchedAt: new Date().toISOString(),
    };
    this.powerCache.set(cacheKey, { expiresAt: Date.now() + POWER_CACHE_TTL_MS, value });
    return value;
  }

  async dashboardTelemetry(userId: string, farmId?: string): Promise<DashboardTelemetry> {
    if (!farmId) {
      throw new BadRequestException("Register and select a farm before requesting telemetry.");
    }
    const power = await this.farmPower(userId, farmId);
    const rainfall = power.days.reduce(
      (total, day) => total + (day.precipitationMm ?? 0),
      0,
    );
    const soilMoisture = [...power.days]
      .reverse()
      .find((day) => day.soilWetness !== null)?.soilWetness;
    const temperatures = power.days
      .map((day) => day.temperatureC)
      .filter((value): value is number => value !== null);
    return {
      coordinates: power.coordinates,
      rainfallMm: Number(rainfall.toFixed(1)),
      soilMoisturePercent:
        soilMoisture === undefined || soilMoisture === null
          ? null
          : Number(Math.min(100, soilMoisture * 100).toFixed(1)),
      temperatureC:
        temperatures.length === 0
          ? null
          : Number(
              (
                temperatures.reduce((sum, value) => sum + value, 0) / temperatures.length
              ).toFixed(1),
            ),
      rainfallTrend: rainfall > 30 ? "Above 30-day threshold" : "Below 30-day threshold",
      soilMoistureTrend:
        soilMoisture === undefined || soilMoisture === null
          ? "Pending"
          : soilMoisture * 100 < 25
            ? "-5%"
            : "Stable",
      source: "NASA POWER",
    };
  }

  private powerLocation(farm: Farm): PowerResponse["coordinates"] {
    if (farm.boundaryGeojson) {
      const boundary = validatePolygon(farm.boundaryGeojson) as GeoJsonPolygon;
      const [longitude, latitude] = polygonCentroid(boundary);
      return { latitude, longitude, source: "boundary-centroid" };
    }
    if (farm.latitude === null || farm.longitude === null) {
      throw new BadRequestException(
        "Add a GPS location or mapped boundary before loading NASA POWER data.",
      );
    }
    return {
      latitude: Number(farm.latitude),
      longitude: Number(farm.longitude),
      source: "farm-location",
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10).replaceAll("-", "");
  }

  private powerValue(value: number | undefined): number | null {
    return value === undefined || value === -999 ? null : value;
  }
  listAlerts(userId: string) {
    return this.alerts.find({
      where: { ownerId: userId },
      order: { occurredOn: "DESC", createdAt: "DESC" },
    });
  }

  async markAlertRead(userId: string, alertId: string) {
    const alert = await this.alerts.findOne({ where: { id: alertId, ownerId: userId } });
    if (!alert) throw new NotFoundException("Alert not found.");
    alert.isRead = true;
    await this.alerts.save(alert);
    return { ok: true };
  }

  async markAllAlertsRead(userId: string) {
    await this.alerts.update({ ownerId: userId, isRead: false }, { isRead: true });
    return { ok: true };
  }
}
