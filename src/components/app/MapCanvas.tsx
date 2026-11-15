import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertTriangle, CloudSun, Leaf, MapPin } from "lucide-react";

import type { Farm } from "@/lib/farm-data";

const GIBS_WMS = "https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi";

const GIBS_LAYERS: Record<string, { id: string; opacity: number }> = {
  "True Color": { id: "MODIS_Terra_CorrectedReflectance_TrueColor", opacity: 1 },
  NDVI: { id: "MODIS_Terra_NDVI_8Day", opacity: 0.75 },
  "Vegetation Health": { id: "VIIRS_SNPP_CorrectedReflectance_TrueColor", opacity: 0.8 },
  Rainfall: { id: "IMERG_Precipitation_Rate", opacity: 0.7 },
};

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
  description?: string;
  icon: typeof Leaf;
  color: string;
}) {
  return (
    <div className="flex min-h-[116px] flex-col justify-between rounded-xl border border-app-ink/10 bg-app-surface p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-app-ink/80">{title}</span>
        <Icon className={`size-4 ${color}`} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-extrabold tracking-tight text-app-heading">{value}</span>
        <span className="rounded-full bg-app-soft px-1.5 py-0.5 text-[9px] font-bold text-app-success">{badge}</span>
      </div>
      <p className="text-[10px] font-medium text-app-ink/60">{subtext}</p>
    </div>
  );
}

export function MapCanvas({ farm, layerType, date }: { farm: Farm | null; layerType: string; date?: string }) {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layers = useRef<L.LayerGroup>(L.layerGroup());
  const imagery = useRef<L.TileLayer.WMS | null>(null);
  const [mapTileError, setMapTileError] = useState(false);

  useEffect(() => {
    if (!mapElement.current || map.current) return;
    const instance = L.map(mapElement.current, { zoomControl: true, attributionControl: true }).setView([9.03, 38.74], 6);
    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
      },
    );
    const streets = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    });
    satellite.on("tileerror", () => {
      setMapTileError(true);
    });
    satellite.addTo(instance);
    L.control.layers({ "Satellite imagery": satellite, "Street map": streets }, undefined, {
      position: "topright",
      collapsed: true,
    }).addTo(instance);
    layers.current.addTo(instance);
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    imagery.current?.removeFrom(instance);
    const layer = GIBS_LAYERS[layerType];
    if (layer) {
      imagery.current = L.tileLayer.wms(GIBS_WMS, {
        layers: layer.id,
        format: "image/png",
        transparent: true,
        version: "1.3.0",
        opacity: layer.opacity,
        ...(date ? { time: date } : {}),
        attribution: "NASA GIBS",
      }).addTo(instance);
      imagery.current.on("tileerror", () => setMapTileError(true));
    }
    layers.current.clearLayers();
    const boundary = farm?.boundaryGeojson?.coordinates[0];
    if (boundary && boundary.length >= 4) {
      const positions = boundary.map(([longitude, latitude]) => [latitude, longitude] as [number, number]);
      const polygon = L.polygon(positions, {
        color: "#16a34a",
        weight: 3,
        fillColor: "#22c55e",
        fillOpacity: 0.25,
      }).addTo(layers.current);
      polygon.bindPopup(
        `<strong>${escapeHtml(farm.name)}</strong><br />Area: ${Number(farm.sizeHectares).toFixed(3)} hectares<br />Crop: ${escapeHtml(farm.crop)}`,
      );
      instance.fitBounds(polygon.getBounds(), { padding: [24, 24] });
    } else if (farm?.latitude !== null && farm?.latitude !== undefined && farm?.longitude !== null && farm?.longitude !== undefined) {
      instance.setView([farm.latitude, farm.longitude], 14);
      L.marker([farm.latitude, farm.longitude]).addTo(layers.current);
    }
  }, [farm, layerType, date]);

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl border border-app-ink/20 bg-app-action/90 md:h-80">
      <div ref={mapElement} className="absolute inset-0" />
      {mapTileError && (
        <div className="absolute bottom-3 right-3 z-[500] rounded bg-red-950/85 px-2 py-1 text-[10px] text-white">
          Satellite imagery is unavailable at this location or temporarily failed.
        </div>
      )}
      <div className="absolute left-3 top-3 z-[500] rounded-lg bg-scrim/75 px-3 py-2 text-xs text-app-on-action backdrop-blur-sm">
        <div className="flex items-center gap-1.5 font-bold"><MapPin className="size-3.5 text-app-warning" />{farm?.name ?? "No plot registered yet"}</div>
        <div className="mt-1 text-[11px] text-app-on-action/80">{farm?.boundaryGeojson ? `${Number(farm.sizeHectares).toFixed(3)} hectares • ${layerType}` : "Add a boundary to view the farm layer."}</div>
      </div>
      <div className="absolute bottom-3 left-3 z-[500] rounded bg-scrim/75 px-2 py-1 text-[10px] text-white">NASA GIBS visualization • not numeric measurement</div>
    </div>
  );
}

export { CloudSun, AlertTriangle };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}
