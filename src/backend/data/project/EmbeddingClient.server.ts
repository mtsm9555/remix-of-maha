/**
 * Generates embeddings via the Lovable AI Gateway.
 * Returns a 1536-dim vector (text-embedding-3-small).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    console.warn("[EmbeddingClient] LOVABLE_API_KEY missing; returning zero vector");
    return new Array(1536).fill(0);
  }
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Embedding request failed: ${res.status} ${body}`);
  }
  const json = (await res.json()) as { data?: Array<{ embedding: number[] }> };
  const vec = json.data?.[0]?.embedding;
  if (!vec) throw new Error("Embedding response missing data[0].embedding");
  return vec;
}