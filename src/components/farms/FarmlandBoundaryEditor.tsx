import { useEffect, useMemo, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  area as turfArea,
  lineString,
  length as turfLength,
  polygon as turfPolygon,
} from "@turf/turf";

export type Boundary = { type: "Polygon"; coordinates: [number, number][][] };
export type MappingMethod = "gps" | "manual";

function close(points: [number, number][]): Boundary | null {
  if (points.length < 3) return null;
  const ring = [...points, points[0]!];
  return { type: "Polygon", coordinates: [ring] };
}

export function FarmlandBoundaryEditor({
  value,
  onChange,
  onMethodChange,
  onLocation,
}: {
  value: Boundary | null;
  onChange: (boundary: Boundary | null) => void;
  onMethodChange?: (method: MappingMethod) => void;
  onLocation?: (point: [number, number]) => void;
}) {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layers = useRef<L.LayerGroup>(L.layerGroup());
  const watchId = useRef<number | null>(null);
  const [method, setMethod] = useState<MappingMethod>("manual");
  const [status, setStatus] = useState("Tap the map to add boundary points.");
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [tracking, setTracking] = useState(false);
  const [points, setPoints] = useState<[number, number][]>(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("agrisupport.pending-boundary")
        : null;
    return (
      value?.coordinates[0]?.slice(0, -1) ??
      (saved ? (JSON.parse(saved) as [number, number][]) : [])
    );
  });
  const [threshold, setThreshold] = useState(50);

  useEffect(() => {
    if (points.length > 0)
      window.localStorage.setItem("agrisupport.pending-boundary", JSON.stringify(points));
    else window.localStorage.removeItem("agrisupport.pending-boundary");
  }, [points]);

  useEffect(() => {
    if (!mapElement.current || map.current) return;
    const instance = L.map(mapElement.current).setView([9.03, 38.74], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(instance);
    layers.current.addTo(instance);
    instance.on("click", (event) => {
      if (method === "manual")
        setPoints((current) => [...current, [event.latlng.lng, event.latlng.lat]]);
    });
    map.current = instance;
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      instance.remove();
      map.current = null;
    };
  }, [method]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    layers.current.clearLayers();
    points.forEach((point, index) => {
      L.marker([point[1], point[0]], { draggable: method === "manual" })
        .on("dragend", (event) => {
          const position = (event.target as L.Marker).getLatLng();
          setPoints((current) =>
            current.map((item, i) => (i === index ? [position.lng, position.lat] : item)),
          );
        })
        .addTo(layers.current)
        .bindTooltip(String(index + 1));
    });
    if (points.length > 1)
      L.polyline(
        points.map(([lng, lat]) => [lat, lng]),
        { color: "#2f855a" },
      ).addTo(layers.current);
    const boundary = close(points);
    if (boundary)
      L.polygon(
        boundary.coordinates[0]!.map(([lng, lat]) => [lat, lng]),
        { color: "#17633d", fillOpacity: 0.2 },
      ).addTo(layers.current);
    if (points.length > 1)
      instance.fitBounds(L.latLngBounds(points.map(([lng, lat]) => [lat, lng])), {
        padding: [24, 24],
      });
    onChange(boundary);
  }, [points, method, onChange]);

  useEffect(() => {
    if (method !== "gps" || !tracking) return;
    if (!navigator.geolocation) {
      setStatus("This device does not provide GPS.");
      setTracking(false);
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy: readingAccuracy } = position.coords;
        setAccuracy(readingAccuracy);
        onLocation?.([longitude, latitude]);
        if (readingAccuracy > threshold) {
          setStatus(
            `Reading rejected: accuracy is ${Math.round(readingAccuracy)}m (limit ${threshold}m).`,
          );
          return;
        }
        setPoints((current) => {
          const previous = current.at(-1);
          if (
            previous &&
            turfLength(lineString([previous, [longitude, latitude]]), { units: "meters" }) < 3
          ) {
            setStatus("GPS is stationary; waiting for movement.");
            return current;
          }
          setStatus("Recording GPS boundary.");
          return [...current, [longitude, latitude]];
        });
      },
      (error) =>
        setStatus(
          error.code === 1
            ? "Location permission was denied."
            : `GPS unavailable: ${error.message}`,
        ),
      { enableHighAccuracy: true, maximumAge: 2_000, timeout: 15_000 },
    );
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [method, tracking, threshold, onLocation]);

  const metrics = useMemo(() => {
    const boundary = close(points);
    if (!boundary) return null;
    return {
      hectares: turfArea(turfPolygon(boundary.coordinates)) / 10_000,
      perimeter: turfLength(lineString(boundary.coordinates[0]!), { units: "kilometers" }),
    };
  }, [points]);

  function clear() {
    setPoints([]);
    onChange(null);
    setStatus("Boundary cleared.");
  }
  function undo() {
    setPoints((current) => current.slice(0, -1));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setMethod("gps");
            onMethodChange?.("gps");
            setStatus("Allow location access, then start mapping.");
          }}
          className={`rounded-lg px-3 py-2 text-xs font-bold ${method === "gps" ? "bg-app-action text-app-on-action" : "bg-app-soft text-app-success"}`}
        >
          Map with GPS
        </button>
        <button
          type="button"
          onClick={() => {
            setMethod("manual");
            onMethodChange?.("manual");
            setTracking(false);
            setStatus("Tap the map to add boundary points.");
          }}
          className={`rounded-lg px-3 py-2 text-xs font-bold ${method === "manual" ? "bg-app-action text-app-on-action" : "bg-app-soft text-app-success"}`}
        >
          Draw manually
        </button>
        {method === "gps" && (
          <button
            type="button"
            onClick={() => {
              setPoints([]);
              setTracking(true);
            }}
            className="rounded-lg bg-app-success-fill px-3 py-2 text-xs font-bold text-app-on-action"
          >
            {tracking ? "Recording…" : "Start mapping"}
          </button>
        )}
        {method === "gps" && tracking && (
          <button
            type="button"
            onClick={() => setTracking(false)}
            className="rounded-lg border px-3 py-2 text-xs font-bold"
          >
            Pause
          </button>
        )}
        {method === "gps" && !tracking && points.length > 0 && (
          <button
            type="button"
            onClick={() => setTracking(true)}
            className="rounded-lg border px-3 py-2 text-xs font-bold"
          >
            Resume
          </button>
        )}
        <button
          type="button"
          onClick={undo}
          disabled={!points.length}
          className="rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-40"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={!points.length}
          className="rounded-lg border border-app-danger/40 px-3 py-2 text-xs font-bold text-app-danger disabled:opacity-40"
        >
          Clear
        </button>
      </div>
      <div className="h-80 overflow-hidden rounded-xl border border-app-ink/20" ref={mapElement} />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-app-ink/70">
        <span>{status}</span>
        <span>
          {points.length} points{accuracy !== null ? ` • ±${Math.round(accuracy)}m` : ""}
        </span>
        {method === "gps" && (
          <label>
            Accuracy limit{" "}
            <input
              className="ml-1 w-16 rounded border px-1"
              type="number"
              min="5"
              max="200"
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value))}
            />{" "}
            m
          </label>
        )}
      </div>
      {metrics && (
        <div className="rounded-lg bg-app-soft p-2 text-xs font-semibold text-app-success">
          Estimated area {metrics.hectares.toFixed(3)} ha • perimeter {metrics.perimeter.toFixed(3)}{" "}
          km
        </div>
      )}
      <p className="text-[11px] text-app-ink/60">
        GPS boundaries are estimates, not survey-grade legal boundaries. You can drag points to
        correct them.
      </p>
    </div>
  );
}
