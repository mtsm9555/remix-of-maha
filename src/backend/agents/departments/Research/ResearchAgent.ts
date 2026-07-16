// src/backend/agents/departments/Research/ResearchAgent.ts
import { BaseAgent } from "../BaseAgent";

export class ResearchAgent extends BaseAgent {
  constructor() {
    super({
      id: 'research-research-agent',
      name: 'Research Agent',
      department: 'research',
      role: 'Deep Research & Analysis Specialist',
      goal: 'Conduct thorough research and provide comprehensive analysis',
      tools: ['web-search', 'academic-databases', 'documents', 'reports', 'knowledge-sources']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const researchType = context.researchType || 'general';
    const depth = context.depth || 'comprehensive';
    const sources = context.sources || [];
    const timeframe = context.timeframe || 'current';

    return `
You are the Research Agent in the Research Department of Maha AI OS.

**Your Role:**
You are an expert research specialist who conducts thorough, unbiased research and provides comprehensive, well-sourced analysis on any topic.

**Your Capabilities:**
- Conduct deep web research across multiple sources
- Analyze academic papers and technical documents
- Synthesize information from diverse sources
- Identify key insights and patterns
- Provide balanced, objective analysis
- Cite sources and verify information
- Create comprehensive research reports
- Identify knowledge gaps and areas for further research
- Cross-reference and fact-check information

**Current Task:**
${task}

**Research Type:** ${researchType}
**Depth:** ${depth}
**Preferred Sources:** ${sources.join(', ')}
**Timeframe:** ${timeframe}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Define clear research objectives
2. Search multiple authoritative sources
3. Verify information through cross-referencing
4. Analyze data and identify patterns
5. Synthesize findings into coherent insights
6. Provide balanced perspectives (pros/cons)
7. Cite all sources with URLs when possible
8. Identify limitations and knowledge gaps
9. Provide actionable recommendations
10. Structure findings logically

**Output Format:**
- Executive Summary
- Research Methodology
- Key Findings (organized by theme)
- Detailed Analysis
- Data & Statistics
- Expert Opinions/Quotes
- Sources & References
- Limitations & Caveats
- Recommendations
- Areas for Further Research
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'research',
      executiveSummary: this.extractSection(response, 'Executive Summary'),
      methodology: this.extractSection(response, 'Methodology'),
      keyFindings: this.extractFindings(response),
      detailedAnalysis: this.extractSection(response, 'Detailed Analysis'),
      statistics: this.extractStatistics(response),
      sources: this.extractSources(response),
      limitations: this.extractSection(response, 'Limitations'),
      recommendations: this.extractList(response, 'Recommendations'),
      furtherResearch: this.extractList(response, 'Further Research'),
      researchType: context.researchType || 'general',
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\w]*:([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractFindings(response: string): any[] {
    const section = this.extractSection(response, 'Key Findings');
    const findings = section.split(/\n\d+\.\s*|\n-\s*|\n•\s*/)
      .filter(s => s.trim().length > 20);
    
    return findings.map((finding, i) => ({
      id: i + 1,
      title: finding.split('\n')[0].trim(),
      description: finding.split('\n').slice(1).join(' ').trim(),
      importance: this.extractImportance(finding)
    }));
  }

  private extractStatistics(response: string): any[] {
    const section = this.extractSection(response, 'Data & Statistics');
    const stats = section.split(/\n-\s*|\n•\s*|\n\d+\.\s*/)
      .filter(s => s.trim().match(/\d+/));
    
    return stats.map(stat => {
      const match = stat.match(/([\d,.]+%?)\s*[-:]?\s*(.+)/);
      return {
        value: match ? match[1] : stat.split(' ')[0],
        description: match ? match[2].trim() : stat.trim()
      };
    });
  }

  private extractSources(response: string): any[] {
    const section = this.extractSection(response, 'Sources');
    const sources = section.split(/\n\d+\.\s*|\n-\s*|\n•\s*/)
      .filter(s => s.trim().length > 10);
    
    return sources.map((source, i) => ({
      id: i + 1,
      citation: source.trim(),
      url: this.extractURL(source),
      type: this.detectSourceType(source)
    }));
  }

  private extractList(response: string, sectionName: string): string[] {
    const section = this.extractSection(response, sectionName);
    return section.split(/\n-\s*|\n•\s*|\n\d+\.\s*/)
      .filter(s => s.trim().length > 10)
      .map(s => s.trim());
  }

  private extractURL(text: string): string {
    const match = text.match(/https?:\/\/[^\s]+/);
    return match ? match[0] : '';
  }

  private detectSourceType(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('academic') || lower.includes('journal') || lower.includes('paper')) return 'academic';
    if (lower.includes('news') || lower.includes('article')) return 'news';
    if (lower.includes('report') || lower.includes('study')) return 'report';
    if (lower.includes('website') || lower.includes('blog')) return 'website';
    return 'other';
  }

  private extractImportance(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('critical') || lower.includes('major') || lower.includes('significant')) return 'high';
    if (lower.includes('moderate') || lower.includes('notable')) return 'medium';
    return 'low';
  }
}