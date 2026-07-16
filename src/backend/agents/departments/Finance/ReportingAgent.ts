// src/backend/agents/departments/Finance/ReportingAgent.ts
import { BaseAgent } from "../BaseAgent";

export class ReportingAgent extends BaseAgent {
  constructor() {
    super({
      id: 'finance-reporting-agent',
      name: 'Reporting Agent',
      department: 'finance',
      role: 'Financial Reporting & Analysis Specialist',
      goal: 'Generate comprehensive financial reports and strategic insights',
      tools: ['excel', 'tableau', 'power-bi', 'analytics', 'spreadsheet']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const reportType = context.reportType || 'comprehensive';
    const period = context.period || 'last quarter';
    const audience = context.audience || 'executives';
    const metrics = context.metrics || [];
    const comparisons = context.comparisons || [];

    return `
You are the Reporting Agent in the Finance Department of Maha AI OS.

**Your Role:**
You are an expert financial reporting specialist who creates clear, insightful, and actionable financial reports that drive strategic decision-making.

**Your Capabilities:**
- Generate Profit & Loss statements
- Create Balance Sheets
- Prepare Cash Flow statements
- Build budget vs actual analyses
- Create financial forecasts
- Analyze financial KPIs and ratios
- Perform variance analysis
- Design executive dashboards
- Create investor-ready reports
- Provide strategic financial insights

**Current Task:**
${task}

**Report Type:** ${reportType}
**Period:** ${period}
**Audience:** ${audience}
**Key Metrics:** ${metrics.join(', ')}
**Comparisons:** ${comparisons.join(', ')}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Understand the reporting requirements and audience
2. Gather and organize relevant financial data
3. Calculate key metrics and ratios
4. Perform trend analysis
5. Compare against benchmarks/previous periods
6. Identify significant variances
7. Provide clear explanations for changes
8. Create visualizations descriptions
9. Highlight risks and opportunities
10. Provide actionable recommendations

**Output Format:**
- Executive Summary
- Key Financial Highlights
- Detailed Financial Statements
  - Income Statement
  - Balance Sheet (if applicable)
  - Cash Flow Statement (if applicable)
- Key Performance Indicators (KPIs)
- Variance Analysis
- Trend Analysis
- Risk Assessment
- Opportunities Identified
- Strategic Recommendations
- Appendix (detailed calculations)
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'financial_report',
      executiveSummary: this.extractSection(response, 'Executive Summary'),
      highlights: this.extractList(response, 'Highlights'),
      incomeStatement: this.extractFinancialStatement(response, 'Income'),
      balanceSheet: this.extractFinancialStatement(response, 'Balance'),
      cashFlow: this.extractFinancialStatement(response, 'Cash Flow'),
      kpis: this.extractKPIs(response),
      varianceAnalysis: this.extractSection(response, 'Variance'),
      trends: this.extractSection(response, 'Trend'),
      risks: this.extractList(response, 'Risk'),
      opportunities: this.extractList(response, 'Opportunit'),
      recommendations: this.extractList(response, 'Recommendations'),
      reportType: context.reportType || 'comprehensive',
      period: context.period || 'last quarter',
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\w]*:([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractList(response: string, sectionName: string): string[] {
    const section = this.extractSection(response, sectionName);
    return section.split(/\n-\s*|\n•\s*|\n\d+\.\s*/)
      .filter(s => s.trim().length > 5)
      .map(s => s.trim());
  }

  private extractFinancialStatement(response: string, statementType: string): any {
    const section = this.extractSection(response, `${statementType} Statement`);
    if (!section) return null;

    const lines = section.split(/\n/).filter(l => l.trim().length > 0);
    const items: any[] = [];
    let total = 0;

    for (const line of lines) {
      const amount = this.extractAmount(line);
      if (amount !== 0) {
        const description = line.replace(/[\$-]?[\d,.]+/g, '').trim();
        if (description.length > 0) {
          items.push({ description, amount });
          if (description.toLowerCase().includes('total') || 
              description.toLowerCase().includes('net')) {
            total = amount;
          }
        }
      }
    }

    return { items, total };
  }

  private extractKPIs(response: string): any[] {
    const section = this.extractSection(response, 'KPI');
    const lines = section.split(/\n/).filter(l => l.trim().length > 5);
    
    return lines.map(line => {
      const parts = line.split(/[:\-|]/).map(p => p.trim());
      return {
        name: parts[0] || '',
        value: parts[1] || '',
        change: this.extractChange(line),
        trend: this.extractTrend(line)
      };
    }).filter(kpi => kpi.name.length > 0);
  }

  private extractAmount(text: string): number {
    const match = text.match(/\$?\s*([\d,.]+)(?:\s*(?:USD|EUR|GBP))?/);
    if (!match) return 0;
    
    const value = match[1].replace(/,/g, '');
    const isNegative = text.includes('-') || text.toLowerCase().includes('expense') || 
                       text.toLowerCase().includes('cost') || text.toLowerCase().includes('loss');
    
    const amount = parseFloat(value);
    return isNegative ? -amount : amount;
  }

  private extractChange(text: string): string {
    const match = text.match(/([+-]?\d+\.?\d*)\s*%/);
    return match ? `${match[1]}%` : '';
  }

  private extractTrend(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('up') || lower.includes('increase') || lower.includes('growth') || lower.includes('↑')) return 'up';
    if (lower.includes('down') || lower.includes('decrease') || lower.includes('decline') || lower.includes('↓')) return 'down';
    if (lower.includes('stable') || lower.includes('flat') || lower.includes('unchanged')) return 'stable';
    return 'neutral';
  }
}