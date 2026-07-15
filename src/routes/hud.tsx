import { createFileRoute } from "@tanstack/react-router";
import MahaOS from "@/components/maha/MahaOS";

export const Route = createFileRoute("/hud")({
  head: () => ({
    meta: [
      { title: "HUD — Maha" },
      { name: "description", content: "Maha OS HUD view." },
      { property: "og:title", content: "HUD — Maha" },
      { property: "og:description", content: "Maha OS HUD view." },
    ],
  }),
  component: MahaOS,
});
