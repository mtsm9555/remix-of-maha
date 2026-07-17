export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible' | 'refunded';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'partially_refunded';
export type CreditStatus = 'available' | 'applied' | 'expired';
export type RefundStatus = 'pending' | 'succeeded' | 'failed';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceUSD: number;
  totalUSD: number;
  type: 'subscription' | 'usage' | 'credit' | 'tax' | 'discount' | 'one_time';
  metadata?: Record<string, any>;
}

export interface Payment {
  id: string;
  tenantId: string;
  invoiceId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeChargeId?: string | null;
  amountUSD: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: { type: 'card' | 'bank_account' | 'manual' | 'credit'; last4?: string; brand?: string };
  createdAt: Date;
  processedAt?: Date | null;
}

export interface Credit {
  id: string;
  tenantId: string;
  amountUSD: number;
  remainingUSD: number;
  currency: string;
  status: CreditStatus;
  reason: string;
  issuedBy: string;
  expiresAt?: Date | null;
  createdAt: Date;
  appliedAt?: Date | null;
}

export interface Refund {
  id: string;
  paymentId: string;
  tenantId: string;
  stripeRefundId?: string | null;
  amountUSD: number;
  currency: string;
  status: RefundStatus;
  reason: string;
  requestedBy: string;
  processedBy?: string | null;
  createdAt: Date;
  processedAt?: Date | null;
}

export interface DunningAttempt {
  id: string;
  invoiceId: string;
  tenantId: string;
  attemptNumber: number;
  status: 'pending' | 'sent' | 'failed';
  scheduledAt: Date;
  sentAt?: Date | null;
  result?: string | null;
}