import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Layers, MapPin, Pencil, Trash2 } from "lucide-react";

import { FarmlandBoundaryEditor, type Boundary } from "@/components/farms/FarmlandBoundaryEditor";
import { CROPS, IRRIGATION_SYSTEMS, REGIONS, type Farm } from "@/lib/farm-data";
import {
  farmsQueryOptions,
  pickActiveFarm,
  profileQueryOptions,
  useAddFarm,
  useChooseFarm,
  useEditFarm,
  useRemoveFarm,
} from "@/lib/queries";

type FormState = {
  name: string;
  crop: string;
  region: string;
  zone: string;
  woreda: string;
  sizeHectares: string;
  plantingDate: string;
  irrigation: string;
  description: string;
  farmType: string;
  ownershipInfo: string;
};

const BLANK: FormState = {
  name: "",
  crop: CROPS[0] as string,
  region: REGIONS[0] as string,
  zone: "",
  woreda: "",
  sizeHectares: "12.0",
  plantingDate: "",
  irrigation: IRRIGATION_SYSTEMS[0] as string,
  description: "",
  farmType: "Mixed farming",
  ownershipInfo: "",
};

function farmToForm(farm: Farm): FormState {
  return {
    name: farm.name,
    crop: farm.crop,
    region: farm.region,
    zone: farm.zone,
    woreda: farm.woreda,
    sizeHectares: String(farm.sizeHectares),
    plantingDate: farm.plantingDate ?? "",
    irrigation: farm.irrigation,
    description: farm.description ?? "",
    farmType: farm.farmType ?? "Mixed farming",
    ownershipInfo: farm.ownershipInfo ?? "",
  };
}

export function FarmsScreen() {
  const { data: farms } = useSuspenseQuery(farmsQueryOptions());
  const { data: profile } = useSuspenseQuery(profileQueryOptions());
  const active = pickActiveFarm(farms, profile.activeFarmId);

  const [form, setForm] = useState<FormState>(BLANK);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [boundary, setBoundary] = useState<Boundary | null>(null);
  const [mappingMethod, setMappingMethod] = useState<"gps" | "manual">("manual");

  const addFarm = useAddFarm();
  const editFarm = useEditFarm();
  const removeFarm = useRemoveFarm();
  const chooseFarm = useChooseFarm();

  const busy = addFarm.isPending || editFarm.isPending;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(farm: Farm) {
    setEditingId(farm.id);
    setForm(farmToForm(farm));
    setBoundary(farm.boundaryGeojson ?? null);
    setMappingMethod(farm.mappingMethod ?? "manual");
    toast(`Editing ${farm.name}`);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(BLANK);
    setBoundary(null);
    setMappingMethod("manual");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      crop: form.crop,
      region: form.region,
      zone: form.zone.trim(),
      woreda: form.woreda.trim(),
      sizeHectares: Number(form.sizeHectares),
      plantingDate: form.plantingDate || undefined,
      irrigation: form.irrigation,
      description: form.description.trim(),
      farmType: form.farmType.trim(),
      ownershipInfo: form.ownershipInfo.trim() || undefined,
      mappingMethod,
      boundaryGeojson: boundary,
    };

    if (payload.name.length < 2) {
      toast.error("Give the plot a name first.");
      return;
    }
    if (!Number.isFinite(payload.sizeHectares) || payload.sizeHectares <= 0) {
      toast.error("Plot size must be more than zero hectares.");
      return;
    }
    if (!boundary) {
      toast.error("Add and close a boundary before registering the farm.");
      return;
    }

    if (editingId) {
      editFarm.mutate(
        { id: editingId, ...payload },
        {
          onSuccess: () => {
            toast.success(`${payload.name} updated.`);
            cancelEdit();
          },
          onError: (error) => toast.error(error.message),
        },
      );
      return;
    }

    addFarm.mutate(payload, {
      onSuccess: (farm) => {
        toast.success(`${farm.name} registered. Satellite fetching has started.`);
        cancelEdit();
      },
      onError: (error) => toast.error(error.message),
    });
  }

  function handleRemove(farm: Farm) {
    removeFarm.mutate(farm.id, {
      onSuccess: () => {
        toast.success(`${farm.name} removed.`);
        if (editingId === farm.id) cancelEdit();
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <label className="block font-medium text-app-heading mb-1" htmlFor="farm-planting-date">
            Planting Date
          </label>
          <input
            id="farm-planting-date"
            type="date"
            value={form.plantingDate}
            onChange={(event) => update("plantingDate", event.target.value)}
            className="w-full p-2.5 rounded-xl border border-app-ink/20 bg-app-bg"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-app-heading">
            Farm Registration & Boundary Management
          </h1>
          <p className="text-xs text-app-ink/70">
            Draw field polygons to fetch specific satellite tiles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-app-heading">Interactive Boundary Editor</h2>
            <button
              onClick={() => {
                setDrawing(!drawing);
                toast(drawing ? "Polygon editing stopped" : "Click map to place vertex pins");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                drawing
                  ? "bg-app-danger text-app-on-action"
                  : "bg-app-success-fill text-app-on-action"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{drawing ? "Cancel Polygon" : "Draw New Boundary"}</span>
            </button>
          </div>

          <FarmlandBoundaryEditor
            value={boundary}
            onChange={setBoundary}
            onMethodChange={setMappingMethod}
          />

          <div className="p-3 bg-app-bg rounded-xl text-xs flex items-center justify-between text-app-ink/80">
            <span>
              Calculated Polygon Area:{" "}
              <strong className="text-app-heading">
                Calculated by the server after submission
              </strong>
            </span>
            <span>
              Mapping method: <strong>{mappingMethod}</strong>
            </span>
          </div>
        </div>

        <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-app-heading">
            {editingId ? "Edit Field Details" : "Register Field Details"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-app-heading mb-1" htmlFor="farm-description">
                Description
              </label>
              <textarea
                id="farm-description"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-app-ink/20"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-app-heading mb-1" htmlFor="farm-type">
                  Farm type
                </label>
                <input
                  id="farm-type"
                  value={form.farmType}
                  onChange={(event) => update("farmType", event.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-app-ink/20"
                />
              </div>
              <div>
                <label className="block font-medium text-app-heading mb-1" htmlFor="farm-ownership">
                  Ownership (optional)
                </label>
                <input
                  id="farm-ownership"
                  value={form.ownershipInfo}
                  onChange={(event) => update("ownershipInfo", event.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-app-ink/20"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium text-app-heading mb-1" htmlFor="farm-name">
                Farm / Plot Name
              </label>
              <input
                id="farm-name"
                type="text"
                required
                placeholder="e.g. Bishoftu North Plot B"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-app-ink/20 focus:ring-2 focus:ring-app-success focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-app-heading mb-1" htmlFor="farm-crop">
                Main Crop
              </label>
              <select
                id="farm-crop"
                value={form.crop}
                onChange={(event) => update("crop", event.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-app-ink/20 bg-app-bg"
              >
                {CROPS.map((crop) => (
                  <option key={crop} value={crop}>
                    {crop}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-app-heading mb-1" htmlFor="farm-region">
                  Region
                </label>
                <select
                  id="farm-region"
                  value={form.region}
                  onChange={(event) => update("region", event.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-app-ink/20 bg-app-bg"
                >
                  {REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-app-heading mb-1" htmlFor="farm-woreda">
                  Woreda
                </label>
                <input
                  id="farm-woreda"
                  type="text"
                  placeholder="e.g. Ada'a"
                  value={form.woreda}
                  onChange={(event) => update("woreda", event.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-app-ink/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-app-heading mb-1" htmlFor="farm-zone">
                  Zone
                </label>
                <input
                  id="farm-zone"
                  type="text"
                  placeholder="e.g. East Shewa"
                  value={form.zone}
                  onChange={(event) => update("zone", event.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-app-ink/20"
                />
              </div>
              <div>
                <label className="block font-medium text-app-heading mb-1" htmlFor="farm-size">
                  Size (Hectares)
                </label>
                <input
                  id="farm-size"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={form.sizeHectares}
                  onChange={(event) => update("sizeHectares", event.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-app-ink/20"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-app-heading mb-1" htmlFor="farm-irrigation">
                Irrigation System
              </label>
              <select
                id="farm-irrigation"
                value={form.irrigation}
                onChange={(event) => update("irrigation", event.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-app-ink/20 bg-app-bg"
              >
                {IRRIGATION_SYSTEMS.map((system) => (
                  <option key={system} value={system}>
                    {system}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl bg-app-action hover:bg-app-success-fill text-app-on-action font-bold text-xs shadow transition disabled:opacity-60"
              >
                {busy ? "Saving…" : editingId ? "Save Changes" : "Save Farm Profile"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-2.5 rounded-xl border border-app-ink/20 text-app-ink/70 text-xs font-semibold"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-bold text-app-heading">
          Active Registered Farms ({farms.length})
        </h2>

        {farms.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-app-ink/20 bg-app-surface text-center space-y-2">
            <MapPin className="w-6 h-6 text-app-success mx-auto" />
            <p className="text-sm font-semibold text-app-heading">No plots registered yet</p>
            <p className="text-xs text-app-ink/70">
              Use the form above to register your first field.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {farms.map((farm) => {
              const isActive = active?.id === farm.id;
              return (
                <div
                  key={farm.id}
                  className={`p-4 rounded-2xl border transition space-y-2 ${
                    isActive
                      ? "bg-app-surface border-app-success ring-2 ring-app-success shadow-md"
                      : "bg-app-surface border-app-ink/10 hover:border-app-success/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-app-heading text-sm">{farm.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-app-soft text-app-success font-bold shrink-0">
                      {farm.crop}
                    </span>
                  </div>
                  <p className="text-xs text-app-ink/70">
                    {[farm.woreda, farm.region].filter(Boolean).join(", ") || farm.region} •{" "}
                    {farm.sizeHectares} Ha
                  </p>
                  <div className="pt-2 border-t border-app-ink/10 flex items-center justify-between text-[11px] text-app-ink/60">
                    <span>
                      NDVI Index:{" "}
                      <strong className="text-app-success">{farm.ndvi.toFixed(2)}</strong>
                    </span>
                    <span className="truncate pl-2 text-right">{farm.lastObservation}</span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        chooseFarm.mutate(farm.id, {
                          onSuccess: () => toast(`${farm.name} is now your active plot.`),
                          onError: (error) => toast.error(error.message),
                        })
                      }
                      disabled={isActive || chooseFarm.isPending}
                      className="flex-1 px-2 py-1.5 rounded-lg bg-app-soft text-app-success text-[11px] font-bold hover:bg-app-success-fill hover:text-app-on-action transition disabled:opacity-50"
                    >
                      {isActive ? "Active plot" : "Make active"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(farm)}
                      title={`Edit ${farm.name}`}
                      className="p-1.5 rounded-lg border border-app-ink/15 text-app-ink/70 hover:text-app-heading"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(farm)}
                      title={`Delete ${farm.name}`}
                      disabled={removeFarm.isPending}
                      className="p-1.5 rounded-lg border border-app-danger/40 text-app-danger hover:bg-app-danger hover:text-app-on-action transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
