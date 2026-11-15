// Browser-safe module: shared shapes, option lists and chart datasets.

export type Farm = {
  id: string;
  name: string;
  region: string;
  zone: string;
  woreda: string;
  crop: string;
  sizeHectares: number;
  irrigation: string;
  plantingDate: string | null;
  ndvi: number;
  ndviChange: string;
  healthStatus: string;
  moisture: string;
  droughtRisk: string;
  latitude: number | null;
  longitude: number | null;
  lastObservation: string;
  description?: string;
  farmType?: string;
  ownershipInfo?: string | null;
  mappingMethod?: "gps" | "manual";
  boundaryGeojson?: { type: "Polygon"; coordinates: [number, number][][] } | null;
  areaSquareMeters?: number | null;
  perimeterMeters?: number | null;
};

export type FarmAlert = {
  id: string;
  title: string;
  farmName: string;
  severity: "High" | "Medium" | "Low" | string;
  category: string;
  evidence: string;
  recommendation: string;
  read: boolean;
  occurredOn: string;
};

export type FarmerProfile = {
  displayName: string;
  language: string;
  role: AgriculturalRole;
  activeFarmId: string | null;
};

export const AGRICULTURAL_ROLES = [
  "farmer",
  "agricultural_expert",
  "climate_researcher",
  "cooperative_leader",
] as const;

export type AgriculturalRole = (typeof AGRICULTURAL_ROLES)[number];

const ROLE_LABELS: Record<AgriculturalRole, string> = {
  farmer: "Farmer",
  agricultural_expert: "Agricultural Expert",
  climate_researcher: "Climate Researcher",
  cooperative_leader: "Cooperative Leader",
};

const ROLE_VALUES: Record<string, AgriculturalRole> = Object.fromEntries(
  AGRICULTURAL_ROLES.map((role) => [ROLE_LABELS[role], role]),
) as Record<string, AgriculturalRole>;

export function roleLabel(role: AgriculturalRole): string {
  return ROLE_LABELS[role] ?? ROLE_LABELS.farmer;
}

export function roleValue(label: string): AgriculturalRole {
  return ROLE_VALUES[label] ?? "farmer";
}

export const SUPPORTED_LANGUAGES = ["English", "Amharic", "Afaan Oromo"] as const;

export const REGIONS = ["Oromia", "Amhara", "SNNPR", "Tigray", "Sidama"] as const;

export const CROPS = [
  "Teff (Quncho / Magal)",
  "Arabica Coffee",
  "Durum Wheat",
  "Maize",
  "Barley",
  "Sorghum",
] as const;

export const IRRIGATION_SYSTEMS = [
  "Rain-fed Agriculture",
  "Gravity Surface Irrigation",
  "Drip System",
  "Shaded / Mixed",
] as const;

export const HISTORICAL_NDVI_DATA = [
  { month: "Jun", current2026: 0.28, baseline5Yr: 0.3, minHistorical: 0.22, maxHistorical: 0.35 },
  { month: "Jul", current2026: 0.42, baseline5Yr: 0.4, minHistorical: 0.31, maxHistorical: 0.48 },
  { month: "Aug", current2026: 0.65, baseline5Yr: 0.61, minHistorical: 0.49, maxHistorical: 0.7 },
  { month: "Sep", current2026: 0.78, baseline5Yr: 0.74, minHistorical: 0.6, maxHistorical: 0.82 },
  { month: "Oct", current2026: 0.72, baseline5Yr: 0.68, minHistorical: 0.55, maxHistorical: 0.76 },
  { month: "Nov", current2026: 0.59, baseline5Yr: 0.57, minHistorical: 0.44, maxHistorical: 0.63 },
  { month: "Dec", current2026: null, baseline5Yr: 0.38, minHistorical: 0.28, maxHistorical: 0.45 },
];

export const RAINFALL_DATA = [
  { month: "May", actual: 45, average: 55, gpmAnomaly: -10 },
  { month: "Jun", actual: 110, average: 125, gpmAnomaly: -15 },
  { month: "Jul", actual: 240, average: 210, gpmAnomaly: 30 },
  { month: "Aug", actual: 295, average: 280, gpmAnomaly: 15 },
  { month: "Sep", actual: 160, average: 140, gpmAnomaly: 20 },
  { month: "Oct", actual: 38, average: 50, gpmAnomaly: -12 },
  { month: "Nov", actual: 8, average: 15, gpmAnomaly: -7 },
];

export const SOIL_MOISTURE_DATA = [
  { day: "Oct 1", surface: 38, rootzone: 45, thresholdMin: 25 },
  { day: "Oct 5", surface: 35, rootzone: 44, thresholdMin: 25 },
  { day: "Oct 10", surface: 32, rootzone: 41, thresholdMin: 25 },
  { day: "Oct 15", surface: 28, rootzone: 38, thresholdMin: 25 },
  { day: "Oct 20", surface: 24, rootzone: 35, thresholdMin: 25 },
  { day: "Oct 25", surface: 31, rootzone: 34, thresholdMin: 25 },
  { day: "Oct 30", surface: 34, rootzone: 36, thresholdMin: 25 },
  { day: "Nov 5", surface: 29, rootzone: 32, thresholdMin: 25 },
];

export const TEMPERATURE_DATA = [
  { day: "Oct 28", maxTemp: 27.4, minTemp: 12.1, lstAvg: 23.5 },
  { day: "Oct 29", maxTemp: 28.2, minTemp: 13.0, lstAvg: 24.1 },
  { day: "Oct 30", maxTemp: 29.0, minTemp: 12.8, lstAvg: 25.0 },
  { day: "Oct 31", maxTemp: 29.5, minTemp: 13.2, lstAvg: 25.8 },
  { day: "Nov 01", maxTemp: 30.1, minTemp: 14.0, lstAvg: 26.2 },
  { day: "Nov 02", maxTemp: 28.8, minTemp: 13.5, lstAvg: 24.9 },
  { day: "Nov 03", maxTemp: 27.9, minTemp: 12.4, lstAvg: 23.8 },
];

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AG";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/** The plot the farmer last picked, or the first one they own. */
export function pickActiveFarm(farms: Farm[], activeFarmId: string | null): Farm | null {
  if (farms.length === 0) return null;
  return farms.find((farm) => farm.id === activeFarmId) ?? farms[0]!;
}
