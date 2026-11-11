import { createFileRoute } from "@tanstack/react-router";

import { ReportsScreen } from "@/components/screens/ReportsScreen";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — AgriSense Ethiopia" },
      {
        name: "description",
        content: "Crop health audit summaries you can share with banks or cooperatives.",
      },
    ],
  }),
  component: ReportsScreen,
});
