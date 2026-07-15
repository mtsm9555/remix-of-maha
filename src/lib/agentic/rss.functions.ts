import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Parser from "rss-parser";

// Port of reference/agentic-os/server/collectors/rss.js — TanStack server fn version.

const parser = new Parser({ timeout: 15000 });

const inputSchema = z.object({
  url: z.string().url(),
  tags: z.array(z.string()).default([]),
  maxItems: z.number().int().min(1).max(100).default(50),
});

function stripHtml(html: string | undefined): string {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export type CollectedArticle = {
  title: string;
  url: string;
  summary: string;
  raw_markdown: string;
  published_at: string | null;
  topic_tags: string[];
};

export const collectRssFeed = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<{ items: CollectedArticle[] }> => {
    const { requireUnlocked } = await import("../gate.server");
    await requireUnlocked();
    const feed = await parser.parseURL(data.url).catch(() => null);
    if (!feed?.items) throw new Error("Not a valid RSS/Atom feed");

    const items: CollectedArticle[] = feed.items.slice(0, data.maxItems).map((item) => {
      const summary = stripHtml(
        (item.contentSnippet as string | undefined) ??
          (item.content as string | undefined) ??
          (item.summary as string | undefined) ??
          "",
      );
      return {
        title: item.title?.trim() || "(untitled)",
        url: item.link || (item.guid as string | undefined) || data.url,
        summary: summary.slice(0, 600),
        raw_markdown: stripHtml(
          ((item as Record<string, unknown>)["content:encoded"] as string | undefined) ??
            (item.content as string | undefined) ??
            summary,
        ).slice(0, 8000),
        published_at: (item.isoDate as string | undefined) ?? item.pubDate ?? null,
        topic_tags: data.tags,
      };
    });

    return { items };
  });
