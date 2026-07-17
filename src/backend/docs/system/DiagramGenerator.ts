import type { DocDiagram } from "./SystemDocumentationTypes";

export class DiagramGenerator {
  static async renderToSVG(diagram: DocDiagram): Promise<string> {
    const data = diagram.data ?? {};
    if (data.type === "mermaid") return this.placeholderSvg("Mermaid Diagram");
    if (data.type === "plantuml") return this.placeholderSvg("PlantUML Diagram");
    throw new Error(`Unsupported diagram type: ${data.type}`);
  }

  private static placeholderSvg(label: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <rect width="800" height="600" fill="#f0f0f0"/>
  <text x="400" y="300" text-anchor="middle" font-family="Arial" font-size="20">${label} Placeholder</text>
</svg>`;
  }

  static generateArchitectureDiagram(components: any[]): DocDiagram {
    return {
      id: `diagram_${Date.now()}`,
      docId: "",
      type: "architecture",
      title: "System Architecture",
      description: "Auto-generated architecture diagram",
      data: { type: "mermaid", content: this.buildArchitectureMermaid(components) },
      position: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private static buildArchitectureMermaid(components: any[]): string {
    const lines = ["graph TD"];
    for (const c of components) {
      lines.push(`  ${c.id}[${c.name}]`);
      for (const dep of c.dependencies ?? []) {
        lines.push(`  ${c.id} --> ${dep}`);
      }
    }
    return lines.join("\n");
  }

  static generateDataFlowDiagram(flows: any[]): DocDiagram {
    const content = ["sequenceDiagram", ...flows.map(f => `  ${f.from}->>${f.to}: ${f.action}`)].join("\n");
    return {
      id: `diagram_${Date.now()}`,
      docId: "",
      type: "data_flow",
      title: "Data Flow",
      data: { type: "mermaid", content },
      position: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}