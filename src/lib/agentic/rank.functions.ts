import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Port of reference/agentic-os/server/ai/rankArticles.js — uses Lovable AI Gateway
// instead of OpenRouter. Stateless: accepts articles, returns rankings.

const RANK_PROMPT = `You are the editorial prioritizer for a social-media content team.

You will receive a JSON array of freshly scraped news/articles and a list of
the team's niche keywords. Score each item for how worthy it is of becoming a
social post RIGHT NOW.

Scoring guidance (priority_score, 0-100):
- 80-100: timely, high-impact, strongly on-niche, clear hook for an audience
- 50-79: relevant and postable but not urgent
- 20-49: weak relevance or low novelty
- 0-19: off-topic, promotional, or stale

Boost items that overlap the niche keywords or the item's own topic tags.
Penalize duplicates, thin content, and pure press releases.

Return ONLY a JSON object of this exact shape:
{
  "rankings": [
    {
      "id": "<the id you were given>",
      "priority_score": <integer 0-100>,
      "reason": "<one short sentence>",
      "suggested_angle": "<a one-line post hook idea>"
    }
  ]
}

Every input id must appear exactly once in "rankings".`;

const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string().default(""),
  tags: z.array(z.string()).default([]),
});

const inputSchema = z.object({
  niche_keywords: z.array(z.string()).default([]),
  articles: z.array(articleSchema).min(1).max(40),
});

export type Ranking = {
  id: string;
  priority_score: number;
  reason: string;
  suggested_angle: string | null;
};

function applyTagBoost(score: number, tags: string[], keywords: string[]): number {
  const lower = keywords.map((k) => k.toLowerCase());
  const overlap = tags.filter((t) => lower.includes(t.toLowerCase()));
  if (!overlap.length) return score;
  return Math.min(100, score + Math.min(15, overlap.length * 5));
}

export const rankArticles = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<{ rankings: Ranking[] }> => {
    const { requireUnlocked } = await import("../gate.server");
    await requireUnlocked();
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const payload = data.articles.map((a) => ({
      id: a.id,
      title: a.title,
      summary: a.summary.slice(0, 400),
      tags: a.tags,
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: RANK_PROMPT },
          {
            role: "user",
            content: JSON.stringify({ niche_keywords: data.niche_keywords, articles: payload }),
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 429) throw new Error("Rate limit hit. Try again in a moment.");
      if (response.status === 402)
        throw new Error("AI credits exhausted. Add credits in Lovable Cloud settings.");
      throw new Error(`AI request failed: ${text}`);
    }

    const json = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = json.choices[0]?.message.content ?? "{}";
    const parsed = JSON.parse(content) as { rankings?: unknown };
    const raw = Array.isArray(parsed.rankings) ? parsed.rankings : [];

    const byId = new Map(data.articles.map((a) => [a.id, a]));
    const rankings: Ranking[] = [];

    for (const r of raw as Array<Record<string, unknown>>) {
      const id = String(r.id ?? "");
      const article = byId.get(id);
      if (!article) continue;
      const base = Math.max(0, Math.min(100, Math.round(Number(r.priority_score) || 0)));
      const score = applyTagBoost(base, article.tags, data.niche_keywords);
      rankings.push({
        id,
        priority_score: score,
        reason: String(r.reason ?? ""),
        suggested_angle: r.suggested_angle == null ? null : String(r.suggested_angle),
      });
    }

    // Neutral score for anything the model skipped.
    const seen = new Set(rankings.map((r) => r.id));
    for (const a of data.articles) {
      if (!seen.has(a.id)) {
        rankings.push({
          id: a.id,
          priority_score: 40,
          reason: "Not scored by model",
          suggested_angle: null,
        });
      }
    }

    return { rankings };
  });
