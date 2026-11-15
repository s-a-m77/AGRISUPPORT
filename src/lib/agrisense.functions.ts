import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireApiAuth } from "@/integrations/api/auth-middleware";
import {
  AGRICULTURAL_ROLES,
  type AgriculturalRole,
  type Farm,
  type FarmAlert,
  type FarmerProfile,
} from "@/lib/farm-data";

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Enter your full name").max(80),
  language: z.string().trim().min(2).max(40),
  role: z.enum(AGRICULTURAL_ROLES),
});

const farmSchema = z.object({
  name: z.string().trim().min(2, "Give the plot a name").max(80),
  crop: z.string().trim().min(2).max(60),
  region: z.string().trim().min(2).max(60),
  zone: z.string().trim().max(60),
  woreda: z.string().trim().max(60),
  sizeHectares: z.coerce.number().positive("Size must be above zero").max(100000),
  irrigation: z.string().trim().min(2).max(60),
  plantingDate: z.string().optional(),
  description: z.string().trim().max(2000).optional(),
  farmType: z.string().trim().max(80).optional(),
  ownershipInfo: z.string().trim().max(200).optional(),
  mappingMethod: z.enum(["gps", "manual"]).optional(),
  boundaryGeojson: z
    .object({
      type: z.literal("Polygon"),
      coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
    })
    .nullable()
    .optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

const editFarmSchema = farmSchema.extend({ id: z.string().uuid() });

async function backendRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const authorization = getRequest()?.headers.get("authorization");
  const baseUrl = process.env.API_URL ?? "http://localhost:3000/api";
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(authorization ? { authorization } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String(body.message)
        : "Backend request failed.";
    throw new Error(message);
  }
  return body as T;
}

function mapFarm(row: Farm): Farm {
  return {
    ...row,
    sizeHectares: Number(row.sizeHectares),
    ndvi: Number(row.ndvi),
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
  };
}

function mapAlert(row: FarmAlert & { isRead?: boolean }): FarmAlert {
  return {
    ...row,
    read: row.read ?? row.isRead ?? false,
  };
}

export const getFarmerProfile = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .handler(() => backendRequest<FarmerProfile>("/data/profile"));

export const saveFarmerProfile = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input: unknown) => profileSchema.parse(input))
  .handler(({ data }) =>
    backendRequest<FarmerProfile>("/data/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  );

export const chooseActiveFarm = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input: { farmId: string }) =>
    z.object({ farmId: z.string().uuid() }).parse(input),
  )
  .handler(({ data }) =>
    backendRequest("/data/profile/active-farm/" + data.farmId, { method: "POST" }),
  );

export const listFarms = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .handler(async () => (await backendRequest<Farm[]>("/data/farms")).map(mapFarm));

export type DashboardTelemetry = {
  coordinates: { latitude: number; longitude: number };
  rainfallMm: number;
  soilMoisturePercent: number | null;
  temperatureC: number | null;
  rainfallTrend: string;
  soilMoistureTrend: string;
  source: "NASA POWER";
};

export const getDashboardTelemetry = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input: { farmId?: string }) =>
    z.object({ farmId: z.string().uuid().optional() }).parse(input),
  )
  .handler(({ data }) =>
    backendRequest<DashboardTelemetry>(
      `/data/dashboard-telemetry${data.farmId ? `?farmId=${data.farmId}` : ""}`,
    ),
  );

export type FarmPower = {
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
  days: Array<{
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
  }>;
  fetchedAt: string;
};

export const getFarmPower = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input: { farmId: string }) =>
    z.object({ farmId: z.string().uuid() }).parse(input),
  )
  .handler(({ data }) => backendRequest<FarmPower>(`/data/farms/${data.farmId}/power`));

export type SatelliteLayerCatalog = {
  wmsUrl: string;
  wmtsUrl: string;
  layers: Array<{ id: string; title: string; resolution: string }>;
  note: string;
};

export type SatelliteSummary = {
  latestModis: FarmObservation | null;
  latestHls: FarmObservation | null;
  latestGpm: FarmObservation | null;
  observations: FarmObservation[];
};

export type FarmObservation = {
  id: string;
  farmId: string;
  observedOn: string;
  ndvi: number | null;
  rainfallMm: number | null;
  source: string;
  productId: string | null;
  retrievedAt: string | null;
  validPixelCount: number | null;
  qualityStatus: string | null;
  spatialResolution: string | null;
  metadata: Record<string, unknown> | null;
};

export const getSatelliteLayers = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input: { farmId: string }) => z.object({ farmId: z.string().uuid() }).parse(input))
  .handler(({ data }) => backendRequest<SatelliteLayerCatalog>(`/farms/${data.farmId}/satellite/layers`));

export const getSatelliteSummary = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input: { farmId: string }) => z.object({ farmId: z.string().uuid() }).parse(input))
  .handler(({ data }) => backendRequest<SatelliteSummary>(`/farms/${data.farmId}/satellite/summary`));

export const getSatelliteHistory = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input: { farmId: string; page?: number }) => z.object({ farmId: z.string().uuid(), page: z.number().optional() }).parse(input))
  .handler(({ data }) => backendRequest<{ items: FarmObservation[]; total: number }>(`/farms/${data.farmId}/satellite/history?page=${data.page ?? 1}`));

export const addFarm = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input: unknown) => farmSchema.parse(input))
  .handler(({ data }) =>
    backendRequest<Farm>("/data/farms", {
      method: "POST",
      body: JSON.stringify(data),
    }).then(mapFarm),
  );

export const editFarm = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input: unknown) => editFarmSchema.parse(input))
  .handler(({ data }) => {
    const { id, ...fields } = data;
    return backendRequest<Farm>(`/data/farms/${id}`, {
      method: "PATCH",
      body: JSON.stringify(fields),
    }).then(mapFarm);
  });

export const removeFarm = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(({ data }) => backendRequest(`/data/farms/${data.id}`, { method: "DELETE" }));

export const listAlerts = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .handler(async () =>
    (await backendRequest<(FarmAlert & { isRead?: boolean })[]>("/data/alerts")).map(mapAlert),
  );

export const markAlertRead = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(({ data }) =>
    backendRequest(`/data/alerts/${data.id}/read`, {
      method: "PATCH",
    }),
  );

export const markAllAlertsRead = createServerFn({ method: "POST" })
  .middleware([requireApiAuth])
  .handler(() => backendRequest("/data/alerts/read-all", { method: "PATCH" }));

export type { AgriculturalRole };
