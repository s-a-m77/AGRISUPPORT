import { describe, expect, it } from "vitest";

import { initialsOf, pickActiveFarm, roleLabel, roleValue } from "@/lib/farm-data";
import type { Farm } from "@/lib/farm-data";

function farm(id: string, name: string): Farm {
  return {
    id,
    name,
    region: "Oromia",
    zone: "East Shewa",
    woreda: "Ada'a",
    crop: "Teff",
    sizeHectares: 12,
    irrigation: "Rain-fed",
    plantingDate: null,
    ndvi: 0.7,
    ndviChange: "+1%",
    healthStatus: "Optimal",
    moisture: "30%",
    droughtRisk: "Low",
    latitude: null,
    longitude: null,
    lastObservation: "Landsat 9",
  };
}

describe("Active plot selection", () => {
  it("keeps the plot the farmer last chose", () => {
    const farms = [farm("a", "North"), farm("b", "South")];
    expect(pickActiveFarm(farms, "b")?.name).toBe("South");
  });

  it("falls back to the first plot when the stored choice no longer exists", () => {
    const farms = [farm("a", "North"), farm("b", "South")];
    expect(pickActiveFarm(farms, "deleted")?.name).toBe("North");
    expect(pickActiveFarm(farms, null)?.name).toBe("North");
  });

  it("has no active plot when the farmer owns nothing", () => {
    expect(pickActiveFarm([], "a")).toBeNull();
  });
});

describe("Agricultural focus", () => {
  it("round-trips the stored focus through the label shown in settings", () => {
    expect(roleLabel("cooperative_leader")).toBe("Cooperative Leader");
    expect(roleValue("Cooperative Leader")).toBe("cooperative_leader");
    expect(roleValue("something invented")).toBe("farmer");
  });
});

describe("Profile initials", () => {
  it("uses the first and last name initials", () => {
    expect(initialsOf("Abebe Kebede")).toBe("AK");
    expect(initialsOf("Abebe")).toBe("AB");
    expect(initialsOf("   ")).toBe("AG");
  });
});
