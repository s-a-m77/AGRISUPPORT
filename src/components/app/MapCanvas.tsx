import { Leaf, CloudSun, AlertTriangle, MapPin } from "lucide-react";

import type { Farm } from "@/lib/farm-data";

export function KpiCard({
  title,
  value,
  badge,
  subtext,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  badge: string;
  subtext: string;
  icon: typeof Leaf;
  color: string;
}) {
  return (
    <div className="bg-app-surface rounded-2xl p-4 border border-app-ink/10 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-app-ink/70">{title}</span>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-extrabold text-app-heading">{value}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-app-soft text-app-success">
          {badge}
        </span>
      </div>
      <p className="text-[11px] text-app-ink/60">{subtext}</p>
    </div>
  );
}

export function MapCanvas({ farm, layerType }: { farm: Farm | null; layerType: string }) {
  const lat = farm?.latitude ?? null;
  const lng = farm?.longitude ?? null;

  return (
    <div className="relative w-full h-72 md:h-80 rounded-xl overflow-hidden bg-app-action/90 border border-app-ink/20 flex items-center justify-center text-app-on-action">
      <div className="absolute inset-0 map-mesh [background-size:16px_16px] opacity-40" />

      {layerType === "NDVI" && (
        <div className="absolute inset-0 bg-gradient-to-tr from-app-success-fill/40 via-app-gold/20 to-app-success-fill/60 pointer-events-none" />
      )}
      {layerType === "Soil" && (
        <div className="absolute inset-0 bg-gradient-to-tr from-app-gold/40 via-app-warning/20 to-app-success-fill/30 pointer-events-none" />
      )}

      <div className="relative z-10 text-center p-4 bg-scrim/50 backdrop-blur-md rounded-2xl border border-app-on-action/20 max-w-sm space-y-2">
        <div className="inline-flex items-center space-x-2 text-app-warning text-xs font-bold">
          <MapPin className="w-4 h-4" />
          <span>{farm?.name ?? "No plot registered yet"}</span>
        </div>
        <p className="text-xs text-app-on-action/90">
          {lat !== null && lng !== null
            ? `Polygon Coordinates: Lat ${lat}° N, Lng ${lng}° E`
            : "Add a plot to start satellite fetching."}
        </p>
        <div className="flex items-center justify-center space-x-2 text-[11px] text-app-on-action/70">
          <span className="px-2 py-0.5 bg-app-success-fill rounded-md text-app-on-action font-semibold">
            {farm ? `${farm.sizeHectares} Hectares` : "0 Hectares"}
          </span>
          <span className="px-2 py-0.5 bg-app-surface/20 rounded-md">
            Layer: {layerType} Overlay
          </span>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 z-20 bg-scrim/70 backdrop-blur-md text-app-on-action text-[10px] px-3 py-1.5 rounded-lg border border-app-on-action/20 flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-app-danger-soft0" /> <span>0.2 Dry</span>
        <span className="w-2 h-2 rounded-full bg-app-gold" /> <span>0.5 Moderate</span>
        <span className="w-2 h-2 rounded-full bg-app-success-fill" /> <span>0.8 Healthy</span>
      </div>
    </div>
  );
}

export { CloudSun, AlertTriangle };
