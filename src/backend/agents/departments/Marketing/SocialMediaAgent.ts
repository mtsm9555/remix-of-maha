import { BaseAgent } from "../BaseAgent";

export class SocialMediaAgent extends BaseAgent {
  constructor() {
    super({
      id: "marketing-social-agent",
      name: "Social Media Agent",
      department: "marketing",
      role: "Social Media Manager",
      goal: "Create engaging social media content and grow online presence",
      tools: ["twitter", "linkedin", "instagram", "facebook", "tiktok", "buffer"],
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const platform = context.platform || "all platforms";
    const goal = context.goal || "engagement";
    return `
You are the Social Media Agent in the Marketing Department of Maha AI OS.

**Current Task:** ${task}
**Platform:** ${platform}
**Goal:** ${goal}

**Context:**
${JSON.stringify(context, null, 2)}

Provide ready-to-post content: caption, hashtags, visual suggestions, posting time, engagement strategy.
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: "social_media",
      posts: this.extractPosts(response),
      platform: context.platform || "all",
      hashtags: this.extractHashtags(response),
      taskCompleted: true,
    };
  }

  private extractPosts(response: string): string[] {
    return response
      .split(/\n\n(?=Post|---|\d+\.)/)
      .filter((p) => p.trim().length > 0)
      .slice(0, 5);
  }

  private extractHashtags(response: string): string[] {
    const matches = response.match(/#[\w]+/g) || [];
    return [...new Set(matches)].slice(0, 20);
  }
}