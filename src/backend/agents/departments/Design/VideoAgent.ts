// src/backend/agents/departments/Design/VideoAgent.ts
import { BaseAgent } from "../BaseAgent";

export class VideoAgent extends BaseAgent {
  constructor() {
    super({
      id: 'design-video-agent',
      name: 'Video Agent',
      department: 'design',
      role: 'Video Content Designer & Producer',
      goal: 'Create engaging video content, scripts, and storyboards',
      tools: ['video-models', 'premiere', 'after-effects', 'canva-video']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const videoType = context.videoType || 'explainer';
    const duration = context.duration || '60 seconds';
    const platform = context.platform || 'YouTube';
    const audience = context.audience || 'general';

    return `
You are the Video Agent in the Design Department of Maha AI OS.

**Your Role:**
You are an expert video content designer who creates engaging video scripts, storyboards, and production plans that captivate audiences.

**Your Capabilities:**
- Write compelling video scripts
- Create detailed storyboards
- Plan video production (shots, transitions, pacing)
- Design video concepts for different platforms
- Write voiceover scripts
- Create animation concepts
- Generate AI video prompts (Runway, Sora, Pika)
- Plan video editing sequences

**Current Task:**
${task}

**Video Type:** ${videoType}
**Duration:** ${duration}
**Platform:** ${platform}
**Target Audience:** ${audience}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Understand the video's purpose and audience
2. Create a compelling hook (first 3 seconds)
3. Structure content for maximum engagement
4. Write detailed script with timing
5. Create storyboard descriptions
6. Suggest music, sound effects, transitions
7. Generate AI video prompts if applicable
8. Include call-to-action

**Output Format:**
- Video Concept Summary
- Script (with timestamps)
- Storyboard (shot-by-shot)
- Visual Style Guide
- Music & Sound Design
- AI Video Generation Prompts
- Editing Notes
- Call-to-Action
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'video_design',
      concept: this.extractSection(response, 'Video Concept'),
      script: this.extractScript(response),
      storyboard: this.extractStoryboard(response),
      visualStyle: this.extractSection(response, 'Visual Style'),
      music: this.extractSection(response, 'Music'),
      aiPrompts: this.extractAIPrompts(response),
      editingNotes: this.extractSection(response, 'Editing Notes'),
      cta: this.extractSection(response, 'Call-to-Action'),
      videoType: context.videoType || 'explainer',
      duration: context.duration || '60 seconds',
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\w]*:([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractScript(response: string): any[] {
    const section = this.extractSection(response, 'Script');
    const segments = section.split(/\[\d{1,2}:\d{2}(?:-\d{1,2}:\d{2})?\]/)
      .filter(s => s.trim().length > 0);
    
    const timestamps = section.match(/\[\d{1,2}:\d{2}(?:-\d{1,2}:\d{2})?\]/g) || [];
    
    return segments.map((segment, i) => ({
      timestamp: timestamps[i] || `[${i * 10}s]`,
      content: segment.trim()
    }));
  }

  private extractStoryboard(response: string): any[] {
    const section = this.extractSection(response, 'Storyboard');
    const shots = section.split(/Shot\s*\d+[:\.]?/i)
      .filter(s => s.trim().length > 0)
      .slice(1);
    
    return shots.map((shot, i) => ({
      shotNumber: i + 1,
      description: shot.trim(),
      duration: this.extractDuration(shot)
    }));
  }

  private extractDuration(text: string): string {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)/i);
    return match ? `${match[1]}s` : '5s';
  }

  private extractAIPrompts(response: string): string[] {
    const section = this.extractSection(response, 'AI Video Generation');
    return section.split(/\n\d+\.\s*|\n-\s*|\n•\s*/)
      .filter(s => s.trim().length > 30)
      .map(s => s.trim())
      .slice(0, 5);
  }
}