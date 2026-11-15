import { BadRequestException } from "@nestjs/common";

import { polygonMetrics, validatePolygon } from "./geo";

describe("farm boundary geometry", () => {
  it("validates a closed polygon and calculates measurements", () => {
    const polygon = validatePolygon({
      type: "Polygon",
      coordinates: [
        [
          [38.74, 9.03],
          [38.741, 9.03],
          [38.741, 9.031],
          [38.74, 9.03],
        ],
      ],
    });
    const metrics = polygonMetrics(polygon);
    expect(metrics.areaSquareMeters).toBeGreaterThan(1);
    expect(metrics.areaHectares).toBe(metrics.areaSquareMeters / 10_000);
    expect(metrics.perimeterMeters).toBeGreaterThan(1);
  });

  it("rejects open and self-intersecting polygons", () => {
    expect(() =>
      validatePolygon({
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
          ],
        ],
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      validatePolygon({
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 1],
            [0, 1],
            [1, 0],
            [0, 0],
          ],
        ],
      }),
    ).toThrow("self-intersect");
  });
});
