import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import {
  AGRICULTURAL_ROLES,
  type AgriculturalRole,
  type Farm,
  type FarmAlert,
  type FarmerProfile,
} from "@/lib/farm-data";

type FarmRow = Database["public"]["Tables"]["farms"]["Row"];
type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];

function toFarm(row: FarmRow): Farm {
  return {
    id: row.id,
    name: row.name,
    region: row.region,
    zone: row.zone,
    woreda: row.woreda,
    crop: row.crop,
    sizeHectares: Number(row.size_hectares),
    irrigation: row.irrigation,
    plantingDate: row.planting_date,
    ndvi: Number(row.ndvi),
    ndviChange: row.ndvi_change,
    healthStatus: row.health_status,
    moisture: row.moisture,
    droughtRisk: row.drought_risk,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    lastObservation: row.last_observation,
  };
}

function toAlert(row: AlertRow): FarmAlert {
  return {
    id: row.id,
    title: row.title,
    farmName: row.farm_name,
    severity: row.severity,
    category: row.category,
    evidence: row.evidence,
    recommendation: row.recommendation,
    read: row.is_read,
    occurredOn: row.occurred_on,
  };
}

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
});

const editFarmSchema = farmSchema.extend({ id: z.string().uuid() });

export const getFarmerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FarmerProfile> => {
    const { supabase, userId } = context;

    const [profileResult, roleResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, language, active_farm_id")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .order("created_at")
        .limit(1)
        .maybeSingle(),
    ]);

    if (profileResult.error) throw new Error(profileResult.error.message);
    if (roleResult.error) throw new Error(roleResult.error.message);

    const role = (roleResult.data?.role ?? "farmer") as AgriculturalRole;

    return {
      displayName: profileResult.data?.display_name ?? "Farmer",
      language: profileResult.data?.language ?? "English",
      role: AGRICULTURAL_ROLES.includes(role) ? role : "farmer",
      activeFarmId: profileResult.data?.active_farm_id ?? null,
    };
  });

export const saveFarmerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => profileSchema.parse(input))
  .handler(async ({ data, context }): Promise<FarmerProfile> => {
    const { supabase, userId } = context;

    const profileResult = await supabase
      .from("profiles")
      .update({
        display_name: data.displayName,
        language: data.language,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (profileResult.error) throw new Error(profileResult.error.message);

    const roleResult = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: data.role }, { onConflict: "user_id,role" });
    if (roleResult.error) throw new Error(roleResult.error.message);

    // Only one focus may be active, so any other declared focus is dropped.
    const dropResult = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .neq("role", data.role);
    if (dropResult.error) throw new Error(dropResult.error.message);

    return {
      displayName: data.displayName,
      language: data.language,
      role: data.role,
      activeFarmId: null,
    };
  });

export const chooseActiveFarm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { farmId: string }) =>
    z.object({ farmId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // RLS makes this a no-op for a plot the caller does not own.
    const owned = await supabase.from("farms").select("id").eq("id", data.farmId).maybeSingle();
    if (owned.error) throw new Error(owned.error.message);
    if (!owned.data) throw new Error("That plot is not in your account.");

    const result = await supabase
      .from("profiles")
      .update({ active_farm_id: data.farmId, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (result.error) throw new Error(result.error.message);
    return { ok: true };
  });

export const listFarms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Farm[]> => {
    const { supabase } = context;
    const result = await supabase
      .from("farms")
      .select("*")
      .order("created_at", { ascending: true });
    if (result.error) throw new Error(result.error.message);
    return (result.data ?? []).map(toFarm);
  });

export const addFarm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => farmSchema.parse(input))
  .handler(async ({ data, context }): Promise<Farm> => {
    const { supabase, userId } = context;
    const result = await supabase
      .from("farms")
      .insert({
        owner_id: userId,
        name: data.name,
        crop: data.crop,
        region: data.region,
        zone: data.zone,
        woreda: data.woreda,
        size_hectares: data.sizeHectares,
        irrigation: data.irrigation,
      })
      .select("*")
      .single();
    if (result.error) throw new Error(result.error.message);
    return toFarm(result.data);
  });

export const editFarm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => editFarmSchema.parse(input))
  .handler(async ({ data, context }): Promise<Farm> => {
    const { supabase } = context;
    const { id, ...fields } = data;
    const result = await supabase
      .from("farms")
      .update({
        name: fields.name,
        crop: fields.crop,
        region: fields.region,
        zone: fields.zone,
        woreda: fields.woreda,
        size_hectares: fields.sizeHectares,
        irrigation: fields.irrigation,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error("That plot is not in your account.");
    return toFarm(result.data);
  });

export const removeFarm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const result = await supabase.from("farms").delete().eq("id", data.id);
    if (result.error) throw new Error(result.error.message);

    // If the removed plot was the active one, fall back to another owned plot.
    const remaining = await supabase
      .from("farms")
      .select("id")
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (remaining.error) throw new Error(remaining.error.message);
    const fallback = await supabase
      .from("profiles")
      .update({ active_farm_id: remaining.data?.id ?? null, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (fallback.error) throw new Error(fallback.error.message);
    return { ok: true, activeFarmId: remaining.data?.id ?? null };
  });

export const listAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FarmAlert[]> => {
    const { supabase } = context;
    const result = await supabase
      .from("alerts")
      .select("*")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false });
    if (result.error) throw new Error(result.error.message);
    return (result.data ?? []).map(toAlert);
  });

export const markAlertRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const result = await supabase.from("alerts").update({ is_read: true }).eq("id", data.id);
    if (result.error) throw new Error(result.error.message);
    return { ok: true };
  });
