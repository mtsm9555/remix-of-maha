import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/settings")({

  head: () => ({
    meta: [
      { title: "Settings — Maha" },
      { name: "description", content: "Configure Maha integrations and API keys." },
      { property: "og:title", content: "Settings — Maha" },
      { property: "og:description", content: "Configure Maha integrations and API keys." },
    ],
  }),
  component: SettingsPage,
});

const KEYS = [
  { label: "Hermes API Key", env: "HERMES_API_KEY" },
  { label: "Picoclaw API Key", env: "PICOCLAW_API_KEY" },
  { label: "Nemotron OCR API Key", env: "NEMOTRON_OCR_API_KEY" },
  { label: "NVIDIA Build API Key", env: "NVIDIA_BUILD_API_KEY" },
  { label: "n8n Webhook Base URL", env: "N8N_WEBHOOK_BASE_URL" },
  { label: "n8n API Key", env: "N8N_API_KEY" },
];

function SettingsPage() {
  return (
    <PageShell
      eyebrow="Configuration"
      title="Settings"
      subtitle="Secrets are stored server-side in Lovable Cloud. Rotate them from your workspace secrets."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {KEYS.map((k) => (
          <div
            key={k.env}
            className="rounded-2xl border border-white/5 bg-[#0d0e14] p-5 shadow-[0_25px_50px_-20px_rgba(0,0,0,0.8)]"
          >
            <div className="text-sm font-medium text-white">{k.label}</div>
            <div className="mt-1 font-mono text-xs text-white/40">{k.env}</div>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-white/60">Managed via server env</span>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
