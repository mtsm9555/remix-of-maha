// src/backend/agents/departments/Support/KnowledgeAgent.ts
import { BaseAgent } from "../BaseAgent";

export class KnowledgeAgent extends BaseAgent {
  constructor() {
    super({
      id: 'support-knowledge-agent',
      name: 'Knowledge Agent',
      department: 'support',
      role: 'Knowledge Base Manager & Documentation Specialist',
      goal: 'Create and maintain comprehensive knowledge base and documentation',
      tools: ['wiki', 'documentation', 'faq-system', 'confluence', 'notion', 'knowledge-base']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const contentType = context.contentType || 'article'; // article, faq, guide, tutorial
    const topic = context.topic || '';
    const audience = context.audience || 'customers';
    const existingContent = context.existingContent || '';

    return `
You are the Knowledge Agent in the Customer Support Department of Maha AI OS.

**Your Role:**
You are an expert knowledge base manager and documentation specialist who creates clear, comprehensive, and searchable documentation that empowers customers to self-serve and reduces support ticket volume.

**Your Capabilities:**
- Write clear, concise knowledge base articles
- Create comprehensive FAQs
- Design step-by-step guides and tutorials
- Structure documentation for easy navigation
- Optimize content for search (SEO for knowledge base)
- Create troubleshooting guides
- Write release notes and changelogs
- Identify content gaps
- Update outdated documentation
- Create video script outlines for tutorials
- Apply consistent style and formatting

**Current Task:**
${task}

**Content Type:** ${contentType}
**Topic:** ${topic}
**Target Audience:** ${audience}
**Existing Content:** ${existingContent}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Research the topic thoroughly
2. Identify the target audience's knowledge level
3. Structure content with clear hierarchy
4. Write in clear, simple language
5. Include step-by-step instructions where applicable
6. Add screenshots/descriptions of visuals needed
7. Include troubleshooting sections
8. Add related articles/references
9. Optimize for search with relevant keywords
10. Include metadata (tags, categories, difficulty level)

**Output Format:**
- Title
- Summary/TL;DR
- Main Content (structured with headings)
- Step-by-Step Instructions (if applicable)
- Troubleshooting Section
- FAQ Section
- Related Articles
- Tags & Categories
- Difficulty Level (Beginner/Intermediate/Advanced)
- Last Updated Date
- Content Gaps Identified
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'knowledge',
      title: this.extractTitle(response),
      summary: this.extractSection(response, 'Summary'),
      content: this.extractMainContent(response),
      steps: this.extractSteps(response),
      troubleshooting: this.extractSection(response, 'Troubleshooting'),
      faq: this.extractFAQ(response),
      relatedArticles: this.extractList(response, 'Related'),
      tags: this.extractTags(response),
      categories: this.extractCategories(response),
      difficulty: this.extractDifficulty(response),
      contentGaps: this.extractList(response, 'Content Gaps'),
      contentType: context.contentType || 'article',
      taskCompleted: true
    };
  }

  private extractTitle(response: string): string {
    const match = response.match(/Title[:\s]+([^\n]+)/i);
    return match ? match[1].trim() : '';
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\w]*[:\\/]([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractMainContent(response: string): string {
    // Extract everything between Summary and Troubleshooting/FAQ
    const match = response.match(/(?:Summary|TL;DR)[:\s\/]*[\s\S]*?\n\n([\s\S]*?)(?=\n\nTroubleshooting|\n\nFAQ|\n\nRelated)/i);
    return match ? match[1].trim() : '';
  }

  private extractSteps(response: string): string[] {
    const stepsSection = response.match(/Step-by-Step[:\s\/]*([\s\S]*?)(?=\n\n[A-Z]|\nTroubleshooting|\nFAQ)/i);
    if (!stepsSection) return [];
    
    return stepsSection[1].split(/\n\d+\.\s*|\n-\s*|\n•\s*/)
      .filter(s => s.trim().length > 5)
      .map(s => s.trim());
  }

  private extractFAQ(response: string): any[] {
    const faqSection = this.extractSection(response, 'FAQ');
    const qaBlocks = faqSection.split(/Q\d+[:\.]?\s*|\n\n/).filter(s => s.trim());
    
    return qaBlocks.map((block, i) => {
      const questionMatch = block.match(/^([^\n]+)\n?A\d*[:\.]?\s*([\s\S]*)/);
      if (questionMatch) {
        return {
          question: questionMatch[1].trim(),
          answer: questionMatch[2].trim()
        };
      }
      return { question: block.split('\n')[0], answer: block.split('\n').slice(1).join(' ') };
    }).filter(qa => qa.question && qa.answer);
  }

  private extractList(response: string, sectionName: string): string[] {
    const section = this.extractSection(response, sectionName);
    return section.split(/\n-\s*|\n•\s*|\n\d+\.\s*/)
      .filter(s => s.trim().length > 3)
      .map(s => s.trim())
      .slice(0, 10);
  }

  private extractTags(response: string): string[] {
    const section = this.extractSection(response, 'Tags');
    return section.split(/[,|\n]/)
      .map(t => t.replace(/^[-•\s]+/, '').trim())
      .filter(t => t.length > 0 && t.length < 30)
      .slice(0, 10);
  }

  private extractCategories(response: string): string[] {
    const section = this.extractSection(response, 'Categories');
    return section.split(/[,|\n]/)
      .map(c => c.replace(/^[-•\s]+/, '').trim())
      .filter(c => c.length > 0)
      .slice(0, 5);
  }

  private extractDifficulty(response: string): string {
    const match = response.match(/Difficulty[:\s]+(Beginner|Intermediate|Advanced)/i);
    return match ? match[1].toLowerCase() : 'intermediate';
  }
}