import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import {
  addFarm,
  chooseActiveFarm,
  editFarm,
  getFarmerProfile,
  getFarmPower,
  getDashboardTelemetry,
  getSatelliteHistory,
  getSatelliteSummary,
  listAlerts,
  markAllAlertsRead,
  listFarms,
  markAlertRead,
  removeFarm,
  saveFarmerProfile,
} from "@/lib/agrisense.functions";
import type { Farm, FarmAlert, FarmerProfile } from "@/lib/farm-data";
import type { FarmPower } from "@/lib/agrisense.functions";

export { pickActiveFarm } from "@/lib/farm-data";

export const appKeys = {
  profile: ["farmer-profile"] as const,
  farms: ["farms"] as const,
  alerts: ["alerts"] as const,
  power: (farmId: string) => ["farm-power", farmId] as const,
  satellite: (farmId: string) => ["satellite", farmId] as const,
};

export function profileQueryOptions() {
  return queryOptions({
    queryKey: appKeys.profile,
    queryFn: () => getFarmerProfile(),
    staleTime: 30_000,
  });
}

export function satelliteSummaryQueryOptions(farmId: string) {
  return queryOptions({
    queryKey: appKeys.satellite(farmId),
    queryFn: () => getSatelliteSummary({ data: { farmId } }),
    staleTime: 15 * 60_000,
  });
}

export function satelliteHistoryQueryOptions(farmId: string) {
  return queryOptions({
    queryKey: [...appKeys.satellite(farmId), "history"],
    queryFn: () => getSatelliteHistory({ data: { farmId } }),
    staleTime: 15 * 60_000,
  });
}

export function farmsQueryOptions() {
  return queryOptions({
    queryKey: appKeys.farms,
    queryFn: () => listFarms(),
    staleTime: 30_000,
  });
}

export function alertsQueryOptions() {
  return queryOptions({
    queryKey: appKeys.alerts,
    queryFn: () => listAlerts(),
    staleTime: 15_000,
  });
}

export function farmPowerQueryOptions(farmId: string) {
  return queryOptions({
    queryKey: appKeys.power(farmId),
    queryFn: () =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        farmId,
      )
        ? getFarmPower({ data: { farmId } })
        : Promise.resolve(null),
    staleTime: 15 * 60_000,
  });
}

export function dashboardTelemetryQueryOptions(farmId?: string) {
  return queryOptions({
    queryKey: ["dashboard-telemetry", farmId ?? "default"] as const,
    queryFn: () => getDashboardTelemetry({ data: farmId ? { farmId } : {} }),
    staleTime: 10 * 60_000,
  });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { displayName: string; language: string; role: FarmerProfile["role"] }) =>
      saveFarmerProfile({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appKeys.profile }),
  });
}

export function useChooseFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (farmId: string) => chooseActiveFarm({ data: { farmId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appKeys.profile }),
  });
}

export function useAddFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      input: Omit<
        Farm,
        | "id"
        | "plantingDate"
        | "ndvi"
        | "ndviChange"
        | "healthStatus"
        | "moisture"
        | "droughtRisk"
        | "latitude"
        | "longitude"
        | "lastObservation"
      >,
    ) => addFarm({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appKeys.farms }),
  });
}

export function useEditFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string } & Record<string, unknown>) => editFarm({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appKeys.farms }),
  });
}

export function useRemoveFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeFarm({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appKeys.farms });
      queryClient.invalidateQueries({ queryKey: appKeys.profile });
    },
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markAlertRead({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appKeys.alerts }),
  });
}

export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllAlertsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: appKeys.alerts }),
  });
}

export type { Farm, FarmAlert, FarmerProfile };
export type { FarmPower };
