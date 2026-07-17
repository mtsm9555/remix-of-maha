import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { generateEmbedding } from "../project/EmbeddingClient.server";
import type { Department } from "../../agents/departments/types";

interface SynthLesson {
  type: "procedural" | "semantic" | "kpi_insight";
  content: string;
  kpiImpact?: { kpiName: string; impactScore: number };
}

async function llmExtract(prompt: string): Promise<{ lessons: SynthLesson[] }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { lessons: [] };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    console.error("[Synthesizer] LLM call failed", res.status, await res.text().catch(() => ""));
    return { lessons: [] };
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content);
  } catch {
    return { lessons: [] };
  }
}

export class ProjectToDepartmentSynthesizer {
  /** Scan a completed project and elevate lessons to department memory. */
  static async synthesizeProjectLearnings(
    projectId: string,
    departmentId: Department,
  ): Promise<number> {
    console.log(
      `[Synthesizer] Extracting departmental wisdom from Project ${projectId} → ${departmentId}`,
    );

    const { data: projectMemories } = await supabaseAdmin
      .from("project_memories")
      .select("type, content, metadata")
      .eq("project_id", projectId)
      .in("type", ["decision", "feedback", "meeting_notes"]);

    if (!projectMemories || projectMemories.length === 0) return 0;

    const contextText = projectMemories
      .map((m: any) => `[${String(m.type).toUpperCase()}] ${m.content}`)
      .join("\n---\n");

    const prompt = `You are the Chief Knowledge Officer for the ${departmentId} department.
Analyze the following raw project artifacts and extract 2-4 high-level "Departmental Lessons Learned" or "Standard Operating Procedures (SOPs)".

**Project Artifacts:**
${contextText}

**Instructions:**
1. Ignore project-specific details (e.g., "Client X liked the blue logo").
2. Focus on repeatable processes, technical discoveries, or strategic insights.
3. If a lesson negatively impacted a KPI, note the KPI name.

**Output strictly in JSON:**
{
  "lessons": [
    { "type": "procedural" | "semantic" | "kpi_insight", "content": "string", "kpiImpact": { "kpiName": "string", "impactScore": number } }
  ]
}`;

    const parsed = await llmExtract(prompt);
    let stored = 0;
    for (const lesson of parsed.lessons ?? []) {
      if (!lesson?.content || !lesson?.type) continue;
      await this.storeSynthesizedMemory(departmentId, projectId, lesson);
      stored++;
    }
    return stored;
  }

  private static async storeSynthesizedMemory(
    deptId: Department,
    projectId: string,
    lesson: SynthLesson,
  ) {
    const embedding = await generateEmbedding(lesson.content);
    const { error } = await supabaseAdmin.from("department_memories").insert({
      department_id: deptId,
      type: lesson.type,
      content: lesson.content,
      embedding: embedding as unknown as string,
      source_project_id: projectId,
      synthesis_state: "synthesized",
      kpi_impact: (lesson.kpiImpact ?? null) as any,
      importance_score: 0.95,
      metadata: {
        tags: ["synthesized", "project_derived"],
        confidentiality: "internal",
      } as any,
    } as any);
    if (error) console.error("[Synthesizer] insert failed:", error);
  }
}