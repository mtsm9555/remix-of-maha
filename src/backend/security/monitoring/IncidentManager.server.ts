// src/backend/security/monitoring/IncidentManager.ts
import { createClient } from "@supabase/supabase-js";
import { SecurityIncident, IncidentResponseAction, IncidentStatus, ThreatSeverity } from "./SecurityMonitoringTypes";
import * as crypto from "crypto";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class IncidentManager {
  
  /**
   * Creates a security incident
   */
  static async createIncident(
    tenantId: string,
    title: string,
    description: string,
    severity: ThreatSeverity,
    category: string,
    relatedEventIds: string[],
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      assignedTo?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<SecurityIncident> {
    const incident: SecurityIncident = {
      id: `inc_${crypto.randomUUID()}`,
      tenantId,
      title,
      description,
      severity,
      category,
      relatedEventIds,
      eventCount: relatedEventIds.length,
      assignedTo: options.assignedTo,
      assignedAt: options.assignedTo ? new Date() : undefined,
      status: 'open',
      priority: options.priority || this.severityToPriority(severity),
      detectedAt: new Date(),
      responseActions: [],
      metadata: options.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await supabase.from('security_incidents').insert({
      ...incident,
      related_event_ids: incident.relatedEventIds,
      assigned_at: incident.assignedAt?.toISOString(),
      detected_at: incident.detectedAt.toISOString(),
      created_at: incident.createdAt.toISOString(),
      updated_at: incident.updatedAt.toISOString()
    });
    
    console.log(`[IncidentManager] Created incident: ${title}`);
    return incident;
  }
  
  /**
   * Adds a response action to an incident
   */
  static async addResponseAction(
    incidentId: string,
    action: string,
    performedBy: string,
    details: Record<string, any>,
    result?: 'success' | 'failed' | 'partial',
    notes?: string
  ): Promise<IncidentResponseAction> {
    const responseAction: IncidentResponseAction = {
      id: `action_${crypto.randomUUID()}`,
      incidentId,
      action,
      performedBy,
      performedAt: new Date(),
      details,
      result,
      notes
    };
    
    await supabase.from('incident_response_actions').insert({
      ...responseAction,
      incident_id: incidentId,
      performed_at: responseAction.performedAt.toISOString()
    });
    
    // Update incident
    await supabase
      .from('security_incidents')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', incidentId);
    
    console.log(`[IncidentManager] Added response action to incident ${incidentId}: ${action}`);
    return responseAction;
  }
  
  /**
   * Updates incident status
   */
  static async updateStatus(
    incidentId: string,
    status: IncidentStatus,
    updatedBy: string,
    notes?: string
  ): Promise<void> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };
    
    switch (status) {
      case 'investigating':
        updates.acknowledged_at = new Date().toISOString();
        break;
      case 'contained':
        updates.contained_at = new Date().toISOString();
        break;
      case 'resolved':
        updates.resolved_at = new Date().toISOString();
        break;
      case 'closed':
        updates.closed_at = new Date().toISOString();
        break;
    }
    
    await supabase
      .from('security_incidents')
      .update(updates)
      .eq('id', incidentId);
    
    console.log(`[IncidentManager] Incident ${incidentId} status updated to ${status}`);
  }
  
  /**
   * Assigns incident to a user
   */
  static async assignIncident(incidentId: string, assignedTo: string): Promise<void> {
    await supabase
      .from('security_incidents')
      .update({
        assigned_to: assignedTo,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', incidentId);
    
    console.log(`[IncidentManager] Incident ${incidentId} assigned to ${assignedTo}`);
  }
  
  /**
   * Adds root cause analysis
   */
  static async addRootCause(
    incidentId: string,
    rootCause: string,
    lessonsLearned: string
  ): Promise<void> {
    await supabase
      .from('security_incidents')
      .update({
        root_cause: rootCause,
        lessons_learned: lessonsLearned,
        updated_at: new Date().toISOString()
      })
      .eq('id', incidentId);
    
    console.log(`[IncidentManager] Root cause added to incident ${incidentId}`);
  }
  
  /**
   * Gets open incidents for a tenant
   */
  static async getOpenIncidents(tenantId: string, limit: number = 50): Promise<SecurityIncident[]> {
    const { data } = await supabase
      .from('security_incidents')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('status', ['open', 'investigating', 'contained'])
      .order('detected_at', { ascending: false })
      .limit(limit);
    
    return (data || []).map((i: any) => ({
      ...i,
      relatedEventIds: i.related_event_ids || [],
      responseActions: [], // Would fetch separately
      detectedAt: new Date(i.detected_at),
      createdAt: new Date(i.created_at),
      updatedAt: new Date(i.updated_at),
      assignedAt: i.assigned_at ? new Date(i.assigned_at) : undefined,
      acknowledgedAt: i.acknowledged_at ? new Date(i.acknowledged_at) : undefined,
      containedAt: i.contained_at ? new Date(i.contained_at) : undefined,
      resolvedAt: i.resolved_at ? new Date(i.resolved_at) : undefined,
      closedAt: i.closed_at ? new Date(i.closed_at) : undefined
    }));
  }
  
  /**
   * Converts severity to priority
   */
  private static severityToPriority(severity: ThreatSeverity): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case 'info':
      case 'low':
        return 'low';
      case 'medium':
        return 'medium';
      case 'high':
        return 'high';
      case 'critical':
        return 'critical';
    }
  }
}