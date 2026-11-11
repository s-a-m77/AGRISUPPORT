import { createFileRoute } from "@tanstack/react-router";

import { AuthScreen } from "@/components/auth/AuthScreen";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AgriSense Ethiopia" },
      {
        name: "description",
        content:
          "Sign in or create an AgriSense Ethiopia account to register your plots and follow crop health.",
      },
      { property: "og:title", content: "Sign in — AgriSense Ethiopia" },
      {
        property: "og:description",
        content:
          "Sign in or create an AgriSense Ethiopia account to register your plots and follow crop health.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthScreen,
});
