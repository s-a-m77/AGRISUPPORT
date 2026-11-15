import { Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as fs from "node:fs/promises";
import ee = require("@google/earthengine");

import { Farm } from "../entities/farm.entity";
import { FarmObservation } from "../entities/farm-observation.entity";
import { validatePolygon, type GeoJsonPolygon } from "../data/geo";

const LAYERS = [
  { id: "MODIS_Terra_CorrectedReflectance_TrueColor", title: "MODIS True Color", resolution: "250 m" },
  { id: "MODIS_Terra_NDVI_8Day", title: "MODIS NDVI (8-day visualization)", resolution: "250 m" },
  { id: "IMERG_Precipitation_Rate", title: "GPM IMERG precipitation rate", resolution: "10 km" },
  { id: "VIIRS_SNPP_CorrectedReflectance_TrueColor", title: "VIIRS True Color", resolution: "375 m" },
];

@Injectable()
export class SatelliteService {
  private geeInitialization: Promise<void> | null = null;

  constructor(
    @InjectRepository(Farm) private readonly farms: Repository<Farm>,
    @InjectRepository(FarmObservation) private readonly observations: Repository<FarmObservation>,
    private readonly config: ConfigService,
  ) {}

  layers() {
    return {
      wmsUrl: this.config.get<string>("nasaGibsWmsUrl") ?? "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi",
      wmtsUrl: this.config.get<string>("nasaGibsWmtsUrl") ?? "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/",
      layers: LAYERS,
      note: "GIBS tiles are visualizations and do not provide numeric NDVI values.",
    };
  }

  async farmSummary(userId: string, farmId: string) {
    await this.getFarm(userId, farmId);
    const observations = await this.observations.find({
      where: { farmId },
      order: { observedOn: "DESC" },
      take: 100,
    });
    return {
      latestModis: observations.find((item) => item.productId?.startsWith("MOD13Q1")) ?? null,
      latestHls: observations.find((item) => item.productId?.startsWith("HLS")) ?? null,
      latestGpm: observations.find((item) => item.productId?.startsWith("IMERG")) ?? null,
      observations,
    };
  }

  async history(userId: string, farmId: string, page = 1, limit = 30) {
    await this.getFarm(userId, farmId);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const [items, total] = await this.observations.findAndCount({
      where: { farmId },
      order: { observedOn: "DESC" },
      skip: Math.max(0, page - 1) * safeLimit,
      take: safeLimit,
    });
    return { items, total, page, limit: safeLimit };
  }

  async hlsSearch(userId: string, farmId: string, startDate?: string, endDate?: string) {
    const farm = await this.getFarm(userId, farmId);
    const baseUrl = this.config.get<string>("nasaCmrStacUrl") ?? "https://cmr.earthdata.nasa.gov/stac/LPCLOUD";
    const response = await fetch(`${baseUrl}/search`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        collections: ["HLSL30_VI_2.0", "HLSS30_VI_2.0"],
        intersects: this.geometry(farm),
        datetime: `${startDate ?? "2020-01-01"}/${endDate ?? new Date().toISOString()}`,
        limit: 50,
      }),
    });
    if (!response.ok) throw new ServiceUnavailableException("NASA HLS STAC search failed.");
    const body = (await response.json()) as { features?: unknown[] };
    return { source: "NASA HLS CMR-STAC", features: body.features ?? [] };
  }

  async productHistory(userId: string, farmId: string, product: "modis" | "gpm") {
    await this.getFarm(userId, farmId);
    const prefix = product === "modis" ? "MOD13Q1" : "IMERG";
    const items = await this.observations.find({
      where: { farmId },
      order: { observedOn: "DESC" },
      take: 100,
    });
    return {
      product,
      source: product === "modis" ? "NASA MODIS MOD13Q1.061" : "NASA GPM IMERG",
      observations: items.filter((item) => item.productId?.startsWith(prefix)),
      message: items.some((item) => item.productId?.startsWith(prefix))
        ? undefined
        : "No processed observation is available for this farm.",
    };
  }

  async refresh(userId: string, farmId: string) {
    await this.getFarm(userId, farmId);
    const result = await this.calculateSentinelNdvi(userId, farmId);
    return {
      status: "completed",
      observation: result,
    };
  }

  async sentinelNdvi(userId: string, farmId: string) {
    const farm = await this.getFarm(userId, farmId);
    return this.calculateSentinelNdvi(userId, farm.id);
  }

  private async calculateSentinelNdvi(userId: string, farmId: string) {
    await this.getFarm(userId, farmId);
    await this.initializeEarthEngine();
    const farm = await this.getFarm(userId, farmId);
    const geometry = this.geometry(farm);
    const eeGeometry = ee.Geometry(geometry);
    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - 180);
    const collection = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
      .filterBounds(eeGeometry)
      .filterDate(start.toISOString(), end.toISOString())
      .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 60))
      .sort("system:time_start", false);
    const image = ee.Image(collection.first());
    const ndvi = image
      .updateMask(image.select("SCL").neq(3).and(image.select("SCL").neq(8)).and(image.select("SCL").neq(9)).and(image.select("SCL").neq(10)))
      .normalizedDifference(["B8", "B4"])
      .rename("NDVI")
      .clip(eeGeometry);
    const statistics = await this.getInfo(ndvi.reduceRegion({
      reducer: ee.Reducer.mean().combine({ reducer2: ee.Reducer.minMax(), sharedInputs: true }).combine({
        reducer2: ee.Reducer.count(),
        sharedInputs: true,
      }),
      geometry: eeGeometry,
      scale: 10,
      maxPixels: 1e8,
      bestEffort: true,
    }));
    const timestamp = await this.getInfo(image.get("system:time_start"));
    const observedOn = new Date(Number(timestamp)).toISOString().slice(0, 10);
    const mean = this.numberOrNull(statistics.NDVI_mean);
    const observation = this.observations.create({
      farmId,
      observedOn,
      ndvi: mean,
      source: "Google Earth Engine",
      productId: "COPERNICUS/S2_SR_HARMONIZED",
      retrievedAt: new Date(),
      validPixelCount: this.integerOrNull(statistics.NDVI_count),
      qualityStatus: "SCL cloud and shadow masked",
      spatialResolution: "10 m",
      metadata: {
        minimum: this.numberOrNull(statistics.NDVI_min),
        maximum: this.numberOrNull(statistics.NDVI_max),
        dataset: "COPERNICUS/S2_SR_HARMONIZED",
      },
    });
    const saved = await this.observations.upsert(observation, ["farmId", "productId", "observedOn"]);
    const map = await this.getMapId(ndvi);
    return { observation: saved.identifiers[0] ?? observation, statistics, observationDate: observedOn, map };
  }

  private async initializeEarthEngine(): Promise<void> {
    if (this.geeInitialization) return this.geeInitialization;
    const project = this.config.get<string>("geeProjectId");
    const credentialsPath = this.config.get<string>("geeCredentialsPath");
    if (!project || !credentialsPath) {
      throw new ServiceUnavailableException(
        "Earth Engine is not configured. Set GEE_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS in backend/.env.",
      );
    }
    this.geeInitialization = fs.readFile(credentialsPath, "utf8")
      .then((contents) => JSON.parse(contents) as { client_email: string; private_key: string })
      .then(
        (credentials) =>
          new Promise<void>((resolve, reject) => {
            ee.data.authenticateViaPrivateKey(credentials, () => {
              ee.initialize(null, null, resolve, reject, null, project);
            }, reject);
          }),
      )
      .catch((error: unknown) => {
        this.geeInitialization = null;
        throw new ServiceUnavailableException(
          `Earth Engine authentication failed: ${error instanceof Error ? error.message : "unknown error"}`,
        );
      });
    return this.geeInitialization;
  }

  private getInfo(value: { getInfo: (callback: (result: unknown, error?: unknown) => void) => void }): Promise<any> {
    return new Promise((resolve, reject) => value.getInfo((result, error) => error ? reject(error) : resolve(result)));
  }

  private getMapId(image: { getMapId: (params: Record<string, unknown>, callback: (result: unknown, error?: unknown) => void) => void }) {
    return new Promise<unknown>((resolve, reject) => image.getMapId(
      { min: -1, max: 1, palette: ["8c510a", "f6e8c3", "d9ef8b", "66bd63", "1a9850", "006837"] },
      (result, error) => error ? reject(error) : resolve(result),
    ));
  }

  private numberOrNull(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  private integerOrNull(value: unknown): number | null {
    return typeof value === "number" && Number.isInteger(value) ? value : null;
  }

  private async getFarm(userId: string, farmId: string) {
    const farm = await this.farms.findOne({ where: { id: farmId, ownerId: userId } });
    if (!farm) throw new NotFoundException("That plot is not in your account.");
    return farm;
  }

  private geometry(farm: Farm): GeoJsonPolygon {
    if (farm.boundaryGeojson) return validatePolygon(farm.boundaryGeojson) as GeoJsonPolygon;
    if (farm.latitude === null || farm.longitude === null) {
      throw new NotFoundException("This farm has no boundary or coordinates.");
    }
    return {
      type: "Polygon",
      coordinates: [[
        [farm.longitude - 0.01, farm.latitude - 0.01],
        [farm.longitude + 0.01, farm.latitude - 0.01],
        [farm.longitude + 0.01, farm.latitude + 0.01],
        [farm.longitude - 0.01, farm.latitude + 0.01],
        [farm.longitude - 0.01, farm.latitude - 0.01],
      ]],
    };
  }
}
