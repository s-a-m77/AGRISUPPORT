import { createFileRoute } from "@tanstack/react-router";

import { ResetPasswordScreen } from "@/components/auth/ResetPasswordScreen";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — AgriSense Ethiopia" },
      {
        name: "description",
        content: "Set a new password for your AgriSense Ethiopia account.",
      },
      { property: "og:title", content: "Choose a new password — AgriSense Ethiopia" },
      {
        property: "og:description",
        content: "Set a new password for your AgriSense Ethiopia account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordScreen,
});
