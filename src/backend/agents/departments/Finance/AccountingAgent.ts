// src/backend/agents/departments/Finance/AccountingAgent.ts
import { BaseAgent } from "../BaseAgent";

export class AccountingAgent extends BaseAgent {
  constructor() {
    super({
      id: 'finance-accounting-agent',
      name: 'Accounting Agent',
      department: 'finance',
      role: 'Accounting & Bookkeeping Specialist',
      goal: 'Maintain accurate financial records and ensure compliance',
      tools: ['quickbooks', 'xero', 'spreadsheet', 'bank-feeds', 'tax-system']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const accountingTask = context.accountingTask || 'bookkeeping';
    const period = context.period || 'current month';
    const accounts = context.accounts || [];
    const transactions = context.transactions || [];

    return `
You are the Accounting Agent in the Finance Department of Maha AI OS.

**Your Role:**
You are an expert accountant and bookkeeper who maintains accurate financial records, ensures compliance, and provides clear financial insights.

**Your Capabilities:**
- Categorize transactions accurately
- Reconcile bank and credit card statements
- Manage accounts payable and receivable
- Track expenses by category and project
- Calculate payroll and tax obligations
- Prepare journal entries
- Manage chart of accounts
- Handle accruals and deferrals
- Ensure GAAP/IFRS compliance
- Identify discrepancies and fraud indicators

**Current Task:**
${task}

**Accounting Task Type:** ${accountingTask}
**Period:** ${period}
**Accounts:** ${JSON.stringify(accounts, null, 2)}
**Transactions:** ${JSON.stringify(transactions, null, 2)}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Analyze the financial data provided
2. Categorize each transaction appropriately
3. Verify calculations and balances
4. Identify any discrepancies
5. Prepare necessary journal entries
6. Reconcile accounts where applicable
7. Calculate tax implications
8. Flag any compliance concerns
9. Provide clear explanations
10. Suggest improvements to processes

**Output Format:**
- Task Summary
- Transaction Categorization
- Journal Entries (if applicable)
- Reconciliation Results
- Discrepancies Found
- Tax Calculations
- Compliance Notes
- Account Balances
- Recommendations
- Next Steps
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'accounting',
      summary: this.extractSection(response, 'Task Summary'),
      categorizations: this.extractCategorizations(response),
      journalEntries: this.extractJournalEntries(response),
      reconciliation: this.extractSection(response, 'Reconciliation'),
      discrepancies: this.extractList(response, 'Discrepancies'),
      taxCalculations: this.extractTaxCalculations(response),
      complianceNotes: this.extractList(response, 'Compliance'),
      balances: this.extractBalances(response),
      recommendations: this.extractList(response, 'Recommendations'),
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\w]*:([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractCategorizations(response: string): any[] {
    const section = this.extractSection(response, 'Categorization');
    const lines = section.split(/\n/).filter(l => l.trim().length > 5);
    
    return lines.map(line => {
      const parts = line.split(/[-:|]/).map(p => p.trim());
      return {
        transaction: parts[0] || '',
        category: parts[1] || 'Uncategorized',
        amount: this.extractAmount(line),
        date: this.extractDate(line)
      };
    }).filter(c => c.transaction.length > 0);
  }

  private extractJournalEntries(response: string): any[] {
    const section = this.extractSection(response, 'Journal');
    const entries = section.split(/Entry\s*\d+[:\.]?/i).filter(s => s.trim().length > 10);
    
    return entries.slice(1).map((entry, i) => ({
      id: i + 1,
      description: entry.split('\n')[0].trim(),
      debit: this.extractAmount(entry, 'debit'),
      credit: this.extractAmount(entry, 'credit'),
      accounts: this.extractAccounts(entry)
    }));
  }

  private extractTaxCalculations(response: string): any {
    const section = this.extractSection(response, 'Tax');
    return {
      income: this.extractAmount(section, 'income'),
      deductions: this.extractAmount(section, 'deductions'),
      taxableIncome: this.extractAmount(section, 'taxable'),
      taxOwed: this.extractAmount(section, 'tax owed|tax due'),
      effectiveRate: this.extractRate(section)
    };
  }

  private extractBalances(response: string): Record<string, number> {
    const section = this.extractSection(response, 'Balance');
    const balances: Record<string, number> = {};
    const matches = section.matchAll(/([A-Za-z\s]+)[:\s]+\$?([\d,.]+)/g);
    
    for (const match of matches) {
      balances[match[1].trim()] = parseFloat(match[2].replace(/,/g, ''));
    }
    
    return balances;
  }

  private extractList(response: string, sectionName: string): string[] {
    const section = this.extractSection(response, sectionName);
    return section.split(/\n-\s*|\n•\s*|\n\d+\.\s*/)
      .filter(s => s.trim().length > 5)
      .map(s => s.trim());
  }

  private extractAmount(text: string, fieldName?: string): number {
    const pattern = fieldName 
      ? new RegExp(`${fieldName}[:\\s]+\\$?([\\d,.]+)`, 'i')
      : /\$\s*([\d,.]+)|([\d,.]+)\s*(?:USD|EUR|GBP)/i;
    
    const match = text.match(pattern);
    if (!match) return 0;
    
    const value = match[1] || match[2];
    return value ? parseFloat(value.replace(/,/g, '')) : 0;
  }

  private extractDate(text: string): string {
    const match = text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : '';
  }

  private extractRate(text: string): string {
    const match = text.match(/([\d.]+)%/);
    return match ? `${match[1]}%` : '';
  }

  private extractAccounts(text: string): string[] {
    return text.split(/\n/)
      .filter(l => l.toLowerCase().includes('debit') || l.toLowerCase().includes('credit') || l.toLowerCase().includes('account'))
      .map(l => l.trim())
      .slice(0, 5);
  }
}