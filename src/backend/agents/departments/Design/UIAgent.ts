// src/backend/agents/departments/Design/UIAgent.ts
import { BaseAgent } from "../BaseAgent";

export class UIAgent extends BaseAgent {
  constructor() {
    super({
      id: 'design-ui-agent',
      name: 'UI Agent',
      department: 'design',
      role: 'User Interface Designer',
      goal: 'Create beautiful, functional, and accessible user interfaces',
      tools: ['figma', 'canva', 'tailwind', 'css', 'image-models']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const component = context.component || 'page';
    const framework = context.framework || 'React';
    const style = context.style || 'modern';
    const brand = context.brand || {};

    return `
You are the UI Agent in the Design Department of Maha AI OS.

**Your Role:**
You are an expert UI designer who creates beautiful, functional, and accessible user interfaces with pixel-perfect attention to detail.

**Your Capabilities:**
- Design UI components (buttons, forms, cards, modals, navigation)
- Create complete page layouts
- Design responsive interfaces (mobile, tablet, desktop)
- Build design systems and style guides
- Generate production-ready code (React, HTML/CSS, Tailwind)
- Apply color theory, typography, spacing principles
- Ensure WCAG accessibility compliance
- Create dark/light mode variants

**Current Task:**
${task}

**Component Type:** ${component}
**Framework:** ${framework}
**Style:** ${style}
**Brand Guidelines:** ${JSON.stringify(brand, null, 2)}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Analyze the design requirements
2. Consider user experience and accessibility
3. Create a clean, modern design
4. Use proper visual hierarchy
5. Ensure responsive behavior
6. Provide production-ready code
7. Include hover states, focus states, transitions
8. Document design decisions

**Output Format:**
- Design Description
- Component Structure (visual hierarchy)
- Color Palette (with hex codes)
- Typography (fonts, sizes, weights)
- Spacing System
- Production Code (React/Tailwind or HTML/CSS)
- Responsive Breakpoints
- Accessibility Notes
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'ui_design',
      description: this.extractSection(response, 'Design Description'),
      structure: this.extractSection(response, 'Component Structure'),
      colors: this.extractColors(response),
      typography: this.extractSection(response, 'Typography'),
      code: this.extractCode(response),
      accessibility: this.extractSection(response, 'Accessibility Notes'),
      framework: context.framework || 'React',
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}:([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractColors(response: string): any {
    const colorSection = this.extractSection(response, 'Color Palette');
    const colors: Record<string, string> = {};
    const matches = colorSection.matchAll(/([A-Za-z\s]+)[:\s]+(#[0-9A-Fa-f]{6})/g);
    
    for (const match of matches) {
      colors[match[1].trim()] = match[2];
    }
    
    return colors;
  }

  private extractCode(response: string): string {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    const matches = [];
    let match;
    
    while ((match = codeBlockRegex.exec(response)) !== null) {
      matches.push(match[1].trim());
    }
    
    return matches.join('\n\n');
  }
}