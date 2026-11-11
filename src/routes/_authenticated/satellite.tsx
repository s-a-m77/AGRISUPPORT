import { createFileRoute } from "@tanstack/react-router";

import { SatelliteScreen } from "@/components/screens/SatelliteScreen";

export const Route = createFileRoute("/_authenticated/satellite")({
  head: () => ({
    meta: [
      { title: "Satellite Intel — AgriSense Ethiopia" },
      { name: "description", content: "Vegetation layers and NDVI history for your plot." },
    ],
  }),
  component: SatelliteScreen,
});
