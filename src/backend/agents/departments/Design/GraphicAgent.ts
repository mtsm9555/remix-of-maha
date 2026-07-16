// src/backend/agents/departments/Design/GraphicAgent.ts
import { BaseAgent } from "../BaseAgent";

export class GraphicAgent extends BaseAgent {
  constructor() {
    super({
      id: 'design-graphic-agent',
      name: 'Graphic Agent',
      department: 'design',
      role: 'Graphic Designer & Visual Artist',
      goal: 'Create stunning visual designs, logos, and brand assets',
      tools: ['figma', 'canva', 'image-models', 'illustrator']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const assetType = context.assetType || 'logo';
    const brand = context.brand || {};
    const style = context.style || 'modern';
    const dimensions = context.dimensions || {};

    return `
You are the Graphic Agent in the Design Department of Maha AI OS.

**Your Role:**
You are an expert graphic designer who creates stunning visual designs, logos, illustrations, and brand assets that communicate effectively.

**Your Capabilities:**
- Design logos and brand identity systems
- Create marketing materials (banners, flyers, posters)
- Design social media graphics
- Create illustrations and icons
- Generate AI image prompts (Midjourney, DALL-E, Stable Diffusion)
- Apply color theory and composition principles
- Design print-ready assets
- Create brand style guides

**Current Task:**
${task}

**Asset Type:** ${assetType}
**Style:** ${style}
**Brand Info:** ${JSON.stringify(brand, null, 2)}
**Dimensions:** ${JSON.stringify(dimensions, null, 2)}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Understand the brand/message requirements
2. Apply appropriate design principles
3. Create detailed visual descriptions
4. Provide color palette with hex codes
5. Suggest typography choices
6. Generate AI image prompts if applicable
7. Provide multiple variations (3-5)
8. Include usage guidelines

**Output Format:**
- Design Concept Description
- Color Palette (with hex codes)
- Typography Recommendations
- Visual Variations (3-5 options)
- AI Image Generation Prompts (if applicable)
- Usage Guidelines
- File Format Recommendations
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'graphic_design',
      concept: this.extractSection(response, 'Design Concept'),
      colors: this.extractColors(response),
      typography: this.extractSection(response, 'Typography'),
      variations: this.extractVariations(response),
      aiPrompts: this.extractAIPrompts(response),
      guidelines: this.extractSection(response, 'Usage Guidelines'),
      assetType: context.assetType || 'logo',
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\w]*:([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractColors(response: string): Record<string, string> {
    const colorSection = this.extractSection(response, 'Color Palette');
    const colors: Record<string, string> = {};
    const matches = colorSection.matchAll(/([A-Za-z\s]+)[:\s]+(#[0-9A-Fa-f]{6})/g);
    
    for (const match of matches) {
      colors[match[1].trim()] = match[2];
    }
    
    return colors;
  }

  private extractVariations(response: string): string[] {
    const section = this.extractSection(response, 'Visual Variations');
    const variations = section.split(/Variation\s*\d+[:\.]?/i)
      .filter(s => s.trim().length > 0)
      .slice(1, 6);
    
    return variations.map(v => v.trim());
  }

  private extractAIPrompts(response: string): string[] {
    const section = this.extractSection(response, 'AI Image Generation');
    const prompts = section.split(/\n\d+\.\s*|\n-\s*|\n•\s*/)
      .filter(s => s.trim().length > 20)
      .map(s => s.trim());
    
    return prompts.slice(0, 5);
  }
}