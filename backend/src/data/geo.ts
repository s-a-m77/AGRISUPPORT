import { BadRequestException } from "@nestjs/common";

export type GeoJsonPolygon = {
  type: "Polygon";
  coordinates: [number, number][][];
};

export function polygonCentroid(polygon: GeoJsonPolygon): [number, number] {
  const ring = polygon.coordinates[0]!;
  let area = 0;
  let longitude = 0;
  let latitude = 0;

  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index]!;
    const [x2, y2] = ring[index + 1]!;
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    longitude += (x1 + x2) * cross;
    latitude += (y1 + y2) * cross;
  }

  if (Math.abs(area) < Number.EPSILON) {
    const points = ring.slice(0, -1);
    return [
      points.reduce((sum, point) => sum + point[0], 0) / points.length,
      points.reduce((sum, point) => sum + point[1], 0) / points.length,
    ];
  }

  return [longitude / (3 * area), latitude / (3 * area)];
}

const EARTH_RADIUS_METERS = 6_371_008.8;

function distance(a: [number, number], b: [number, number]): number {
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const haversine =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

function orientation(a: [number, number], b: [number, number], c: [number, number]) {
  return (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1]);
}

function intersects(
  a: [number, number],
  b: [number, number],
  c: [number, number],
  d: [number, number],
) {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

export function validatePolygon(input: unknown): GeoJsonPolygon {
  if (!input || typeof input !== "object") throw new BadRequestException("Boundary is required.");
  const polygon = input as Partial<GeoJsonPolygon>;
  const ring = polygon.coordinates?.[0];
  if (polygon.type !== "Polygon" || !ring || ring.length < 4) {
    throw new BadRequestException("Boundary must be a closed polygon with at least three points.");
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!Array.isArray(first) || !Array.isArray(last) || first.length !== 2 || last.length !== 2) {
    throw new BadRequestException("Boundary contains invalid coordinates.");
  }
  if (first[0] !== last[0] || first[1] !== last[1]) {
    throw new BadRequestException("Boundary polygon must be closed.");
  }
  for (let index = 0; index < ring.length; index += 1) {
    const point = ring[index]!;
    if (
      !Array.isArray(point) ||
      point.length !== 2 ||
      !Number.isFinite(point[0]) ||
      !Number.isFinite(point[1]) ||
      point[0] < -180 ||
      point[0] > 180 ||
      point[1] < -90 ||
      point[1] > 90
    ) {
      throw new BadRequestException("Boundary contains invalid coordinates.");
    }
    if (index > 0 && point[0] === ring[index - 1]![0] && point[1] === ring[index - 1]![1]) {
      throw new BadRequestException("Boundary cannot contain duplicate consecutive points.");
    }
  }
  for (let i = 0; i < ring.length - 1; i += 1) {
    for (let j = i + 1; j < ring.length - 1; j += 1) {
      if (j === i + 1 || (i === 0 && j === ring.length - 2)) continue;
      if (intersects(ring[i]!, ring[i + 1]!, ring[j]!, ring[j + 1]!)) {
        throw new BadRequestException("Boundary cannot self-intersect.");
      }
    }
  }
  return { type: "Polygon", coordinates: [ring] };
}

export function polygonMetrics(polygon: GeoJsonPolygon) {
  const ring = polygon.coordinates[0]!;
  const meanLat = ring.reduce((sum, point) => sum + point[1], 0) / ring.length;
  const metersPerDegreeLat = 111_132;
  const metersPerDegreeLon = 111_320 * Math.cos((meanLat * Math.PI) / 180);
  let twiceArea = 0;
  let perimeter = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[i + 1]!;
    const px1 = x1 * metersPerDegreeLon;
    const py1 = y1 * metersPerDegreeLat;
    const px2 = x2 * metersPerDegreeLon;
    const py2 = y2 * metersPerDegreeLat;
    twiceArea += px1 * py2 - px2 * py1;
    perimeter += distance(ring[i]!, ring[i + 1]!);
  }
  const areaSquareMeters = Math.abs(twiceArea) / 2;
  if (areaSquareMeters < 1 || areaSquareMeters > 1_000_000_000) {
    throw new BadRequestException("Boundary area must be between 1 m² and 1,000 km².");
  }
  return {
    areaSquareMeters,
    areaHectares: areaSquareMeters / 10_000,
    perimeterMeters: perimeter,
    perimeterKilometers: perimeter / 1_000,
  };
}
