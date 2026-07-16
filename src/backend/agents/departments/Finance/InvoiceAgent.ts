// src/backend/agents/departments/Finance/InvoiceAgent.ts
import { BaseAgent } from "../BaseAgent";

export class InvoiceAgent extends BaseAgent {
  constructor() {
    super({
      id: 'finance-invoice-agent',
      name: 'Invoice Agent',
      department: 'finance',
      role: 'Invoice Generation & Management Specialist',
      goal: 'Create, manage, and track professional invoices with accurate billing',
      tools: ['invoicing-system', 'payment-gateway', 'pdf-generator', 'email', 'crm']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const invoiceType = context.invoiceType || 'standard';
    const client = context.client || {};
    const items = context.items || [];
    const currency = context.currency || 'USD';
    const taxRate = context.taxRate || 0;

    return `
You are the Invoice Agent in the Finance Department of Maha AI OS.

**Your Role:**
You are an expert invoicing specialist who creates professional, accurate, and compliant invoices while managing payment tracking and follow-ups.

**Your Capabilities:**
- Generate professional invoices with proper formatting
- Calculate taxes, discounts, and totals accurately
- Support multiple currencies and tax regimes
- Track payment status and due dates
- Create payment reminder sequences
- Handle payment disputes professionally
- Generate credit notes and refunds
- Apply early payment discounts
- Manage recurring invoices
- Ensure compliance with local tax regulations

**Current Task:**
${task}

**Invoice Type:** ${invoiceType}
**Client Info:** ${JSON.stringify(client, null, 2)}
**Line Items:** ${JSON.stringify(items, null, 2)}
**Currency:** ${currency}
**Tax Rate:** ${taxRate}%

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Verify client information and billing details
2. Calculate line item totals (quantity × rate)
3. Apply discounts if applicable
4. Calculate subtotal, taxes, and grand total
5. Set appropriate payment terms
6. Generate unique invoice number
7. Create professional invoice content
8. Include payment instructions
9. Add late payment penalties if applicable
10. Prepare follow-up/reminder schedule

**Output Format:**
- Invoice Header (number, date, due date)
- Client Information
- Line Items (description, quantity, rate, amount)
- Subtotal, Discounts, Taxes, Grand Total
- Payment Terms & Instructions
- Notes & Terms
- Payment Reminder Schedule
- Currency Conversion (if applicable)
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'invoice',
      invoiceNumber: this.extractField(response, 'Invoice Number'),
      invoiceDate: this.extractField(response, 'Date'),
      dueDate: this.extractField(response, 'Due Date'),
      client: this.extractClient(response),
      lineItems: this.extractLineItems(response),
      subtotal: this.extractAmount(response, 'Subtotal'),
      discount: this.extractAmount(response, 'Discount'),
      tax: this.extractAmount(response, 'Tax'),
      total: this.extractAmount(response, 'Grand Total|Total'),
      paymentTerms: this.extractField(response, 'Payment Terms'),
      paymentInstructions: this.extractSection(response, 'Payment Instructions'),
      reminderSchedule: this.extractList(response, 'Reminder'),
      currency: context.currency || 'USD',
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\w]*:([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractField(response: string, fieldName: string): string {
    const regex = new RegExp(`${fieldName}[:\\s]+([^\\n]+)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractClient(response: string): any {
    return {
      name: this.extractField(response, 'Client(?: Name)?'),
      email: this.extractField(response, 'Email'),
      address: this.extractField(response, 'Address'),
      phone: this.extractField(response, 'Phone')
    };
  }

  private extractLineItems(response: string): any[] {
    const itemsSection = response.match(/Line Items?:([\s\S]*?)(?=Subtotal|Total|Payment)/i);
    if (!itemsSection) return [];

    const lines = itemsSection[1].split(/\n/).filter(l => l.trim().length > 5);
    return lines.map((line, i) => {
      const numbers = line.match(/[\d,.]+/g) || [];
      return {
        id: i + 1,
        description: line.replace(/[\d,.]+/g, '').replace(/[-|]/g, '').trim(),
        quantity: numbers[0] ? parseFloat(numbers[0]) : 1,
        rate: numbers[1] ? parseFloat(numbers[1]) : 0,
        amount: numbers[2] ? parseFloat(numbers[2]) : (numbers[0] ? parseFloat(numbers[0]) : 0)
      };
    }).filter(item => item.description.length > 0);
  }

  private extractAmount(response: string, fieldName: string): number {
    const regex = new RegExp(`${fieldName}[:\\s]+\\$?([\\d,.]+)`, 'i');
    const match = response.match(regex);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
  }

  private extractList(response: string, sectionName: string): string[] {
    const section = this.extractSection(response, sectionName);
    return section.split(/\n-\s*|\n•\s*|\n\d+\.\s*/)
      .filter(s => s.trim().length > 5)
      .map(s => s.trim());
  }
}