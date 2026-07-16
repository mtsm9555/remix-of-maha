// Lightweight LLM wrapper used by the OS layer. Uses Lovable AI Gateway when
// available; otherwise returns a deterministic stub so the OS can still boot.
export async function osGenerate(
  prompt: string,
  opts: { responseFormat?: "json" | "text" } = {},
): Promise<{ content: string }> {
  const key = typeof process !== "undefined" ? process.env?.LOVABLE_API_KEY : undefined;
  if (!key) {
    if (opts.responseFormat === "json") {
      return {
        content: JSON.stringify({
          tasks: [
            { description: prompt.slice(0, 200), agentType: "Generalist" },
          ],
        }),
      };
    }
    return { content: `[stub] ${prompt.slice(0, 200)}` };
  }

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        ...(opts.responseFormat === "json"
          ? { response_format: { type: "json_object" } }
          : {}),
      }),
    });
    const data: any = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return { content };
  } catch {
    return { content: opts.responseFormat === "json" ? '{"tasks":[]}' : "" };
  }
}