// src/backend/security/monitoring/SecurityAlertManager.ts
import { createClient } from "@supabase/supabase-js";
import { SecurityAlert, ThreatSeverity } from "./SecurityMonitoringTypes";
import * as crypto from "crypto";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class SecurityAlertManager {
  
  /**
   * Creates a security alert
   */
  static async createAlert(alert: {
    tenantId: string;
    title: string;
    description: string;
    severity: ThreatSeverity;
    category: string;
    triggerEventId?: string;
    triggerRuleId?: string;
    relatedEventIds: string[];
    notificationChannels: string[];
  }): Promise<SecurityAlert> {
    const fullAlert: SecurityAlert = {
      id: `alert_${crypto.randomUUID()}`,
      tenantId: alert.tenantId,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      category: alert.category,
      triggerEventId: alert.triggerEventId,
      triggerRuleId: alert.triggerRuleId,
      relatedEventIds: alert.relatedEventIds,
      notificationChannels: alert.notificationChannels,
      notifiedAt: new Date(),
      status: 'active',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await supabase.from('security_alerts').insert({
      ...fullAlert,
      related_event_ids: fullAlert.relatedEventIds,
      notification_channels: fullAlert.notificationChannels,
      notified_at: fullAlert.notifiedAt.toISOString(),
      created_at: fullAlert.createdAt.toISOString(),
      updated_at: fullAlert.updatedAt.toISOString()
    });
    
    // Send notifications
    await this.sendNotifications(fullAlert);
    
    console.log(`[SecurityAlertManager] Created alert: ${fullAlert.title}`);
    return fullAlert;
  }
  
  /**
   * Sends notifications for an alert
   */
  private static async sendNotifications(alert: SecurityAlert): Promise<void> {
    for (const channel of alert.notificationChannels) {
      switch (channel) {
        case 'email':
          await this.sendEmail(alert);
          break;
        case 'slack':
          await this.sendSlack(alert);
          break;
        case 'pagerduty':
          await this.sendPagerDuty(alert);
          break;
        case 'webhook':
          await this.sendWebhook(alert);
          break;
      }
    }
  }
  
  /**
   * Sends email notification
   */
  private static async sendEmail(alert: SecurityAlert): Promise<void> {
    // In production, use email service (SendGrid, Postmark, etc.)
    console.log(`[SecurityAlertManager] Would send email: ${alert.title}`);
  }
  
  /**
   * Sends Slack notification
   */
  private static async sendSlack(alert: SecurityAlert): Promise<void> {
    // In production, use Slack API
    console.log(`[SecurityAlertManager] Would send Slack: ${alert.title}`);
  }
  
  /**
   * Sends PagerDuty notification
   */
  private static async sendPagerDuty(alert: SecurityAlert): Promise<void> {
    // In production, use PagerDuty API
    console.log(`[SecurityAlertManager] Would send PagerDuty: ${alert.title}`);
  }
  
  /**
   * Sends webhook notification
   */
  private static async sendWebhook(alert: SecurityAlert): Promise<void> {
    // In production, POST to webhook URL
    console.log(`[SecurityAlertManager] Would send webhook: ${alert.title}`);
  }
  
  /**
   * Acknowledges an alert
   */
  static async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    await supabase
      .from('security_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: acknowledgedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId);
    
    console.log(`[SecurityAlertManager] Alert ${alertId} acknowledged`);
  }
  
  /**
   * Resolves an alert
   */
  static async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    await supabase
      .from('security_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId);
    
    console.log(`[SecurityAlertManager] Alert ${alertId} resolved`);
  }
  
  /**
   * Marks alert as false positive
   */
  static async markFalsePositive(alertId: string, markedBy: string): Promise<void> {
    await supabase
      .from('security_alerts')
      .update({
        status: 'false_positive',
        resolved_at: new Date().toISOString(),
        resolved_by: markedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId);
    
    console.log(`[SecurityAlertManager] Alert ${alertId} marked as false positive`);
  }
  
  /**
   * Gets active alerts for a tenant
   */
  static async getActiveAlerts(tenantId: string, limit: number = 50): Promise<SecurityAlert[]> {
    const { data } = await supabase
      .from('security_alerts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return (data || []).map((a: any) => ({
      ...a,
      relatedEventIds: a.related_event_ids || [],
      notificationChannels: a.notification_channels || [],
      notifiedAt: new Date(a.notified_at),
      createdAt: new Date(a.created_at),
      updatedAt: new Date(a.updated_at),
      acknowledgedAt: a.acknowledged_at ? new Date(a.acknowledged_at) : undefined,
      resolvedAt: a.resolved_at ? new Date(a.resolved_at) : undefined
    }));
  }
}