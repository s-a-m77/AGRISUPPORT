import { createFileRoute } from "@tanstack/react-router";

import { FarmsScreen } from "@/components/screens/FarmsScreen";

export const Route = createFileRoute("/_authenticated/farms")({
  head: () => ({
    meta: [
      { title: "My Farms — AgriSense Ethiopia" },
      { name: "description", content: "Register, edit and remove the plots you farm." },
    ],
  }),
  component: FarmsScreen,
});
