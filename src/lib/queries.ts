import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import {
  addFarm,
  chooseActiveFarm,
  editFarm,
  getFarmerProfile,
  listAlerts,
  listFarms,
  markAlertRead,
  removeFarm,
  saveFarmerProfile,
} from "@/lib/agrisense.functions";
import type { Farm, FarmAlert, FarmerProfile } from "@/lib/farm-data";

export { pickActiveFarm } from "@/lib/farm-data";

export const appKeys = {
  profile: ["farmer-profile"] as const,
  farms: ["farms"] as const,
  alerts: ["alerts"] as const,
};

export function profileQueryOptions() {
  return queryOptions({
    queryKey: appKeys.profile,
    queryFn: () => getFarmerProfile(),
    staleTime: 30_000,
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

export type { Farm, FarmAlert, FarmerProfile };
