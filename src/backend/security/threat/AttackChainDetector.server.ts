// src/backend/security/threat/AttackChainDetector.ts
import { createClient } from "@supabase/supabase-js";
import { AttackChain, AttackChainEvent, MITRETactic, KillChainPhase } from "./ThreatDetectionTypes";
import * as crypto from "crypto";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class AttackChainDetector {
  
  // MITRE ATT&CK to Kill Chain mapping
  private static readonly TACTIC_TO_KILL_CHAIN: Record<MITRETactic, KillChainPhase> = {
    'reconnaissance': 'reconnaissance',
    'resource_development': 'weaponization',
    'initial_access': 'delivery',
    'execution': 'exploitation',
    'persistence': 'installation',
    'privilege_escalation': 'installation',
    'defense_evasion': 'command_and_control',
    'credential_access': 'command_and_control',
    'discovery': 'command_and_control',
    'lateral_movement': 'command_and_control',
    'collection': 'actions_on_objectives',
    'command_and_control': 'command_and_control',
    'exfiltration': 'actions_on_objectives',
    'impact': 'actions_on_objectives'
  };
  
  /**
   * Detects attack chains from security events
   */
  static async detectAttackChains(tenantId: string, timeWindowMinutes: number = 60): Promise<AttackChain[]> {
    console.log(`[AttackChain] Detecting attack chains for tenant ${tenantId}`);
    
    const startTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    
    // Fetch recent security events with MITRE mappings
    const { data: events } = await supabase
      .from('security_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('detected_at', startTime.toISOString())
      .order('detected_at', { ascending: true });
    
    if (!events || events.length < 3) return [];
    
    // Group events by actor
    const eventsByActor: Record<string, any[]> = {};
    for (const event of events) {
      if (!eventsByActor[event.actor_id]) eventsByActor[event.actor_id] = [];
      eventsByActor[event.actor_id].push(event);
    }
    
    const detectedChains: AttackChain[] = [];
    
    // Analyze each actor's events for attack patterns
    for (const [actorId, actorEvents] of Object.entries(eventsByActor)) {
      if (actorEvents.length < 3) continue;
      
      // Extract MITRE tactics from events
      const tactics = this.extractTactics(actorEvents);
      
      if (tactics.length < 2) continue;
      
      // Check for known attack patterns
      const pattern = this.matchAttackPattern(tactics);
      
      if (pattern) {
        const chain = await this.createAttackChain(
          tenantId,
          actorId,
          actorEvents,
          pattern,
          tactics
        );
        
        detectedChains.push(chain);
      }
    }
    
    console.log(`[AttackChain] Detected ${detectedChains.length} attack chains`);
    return detectedChains;
  }
  
  /**
   * Extracts MITRE tactics from events
   */
  private static extractTactics(events: any[]): MITRETactic[] {
    const tactics: Set<MITRETactic> = new Set();
    
    for (const event of events) {
      // Map event types to MITRE tactics
      const tactic = this.eventTypeToTactic(event.event_type);
      if (tactic) tactics.add(tactic);
    }
    
    return Array.from(tactics);
  }
  
  /**
   * Maps event types to MITRE tactics
   */
  private static eventTypeToTactic(eventType: string): MITRETactic | null {
    const mappings: Record<string, MITRETactic> = {
      'brute_force_attempt': 'credential_access',
      'credential_stuffing': 'credential_access',
      'unauthorized_access_attempt': 'initial_access',
      'privilege_escalation_attempt': 'privilege_escalation',
      'data_exfiltration_attempt': 'exfiltration',
      'bulk_data_download': 'collection',
      'suspicious_ip_activity': 'reconnaissance',
      'known_malicious_ip': 'command_and_control',
      'api_abuse': 'execution',
      'injection_attempt': 'execution',
      'agent_behavior_anomaly': 'lateral_movement',
      'secret_access_anomaly': 'credential_access'
    };
    
    return mappings[eventType] || null;
  }
  
  /**
   * Matches known attack patterns
   */
  private static matchAttackPattern(tactics: MITRETactic[]): {
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  } | null {
    // Credential Access -> Lateral Movement -> Exfiltration (Classic APT pattern)
    if (
      tactics.includes('credential_access') &&
      tactics.includes('lateral_movement') &&
      tactics.includes('exfiltration')
    ) {
      return {
        name: 'Advanced Persistent Threat (APT) Pattern',
        description: 'Credential theft followed by lateral movement and data exfiltration',
        severity: 'critical'
      };
    }
    
    // Reconnaissance -> Initial Access -> Execution (Attack Pattern)
    if (
      tactics.includes('reconnaissance') &&
      tactics.includes('initial_access') &&
      tactics.includes('execution')
    ) {
      return {
        name: 'Targeted Attack Pattern',
        description: 'Reconnaissance followed by initial access and code execution',
        severity: 'high'
      };
    }
    
    // Credential Access -> Privilege Escalation (Insider Threat)
    if (
      tactics.includes('credential_access') &&
      tactics.includes('privilege_escalation')
    ) {
      return {
        name: 'Privilege Escalation Attack',
        description: 'Credential theft followed by privilege escalation attempt',
        severity: 'high'
      };
    }
    
    // Collection -> Exfiltration (Data Theft)
    if (
      tactics.includes('collection') &&
      tactics.includes('exfiltration')
    ) {
      return {
        name: 'Data Exfiltration Attack',
        description: 'Data collection followed by exfiltration attempt',
        severity: 'critical'
      };
    }
    
    return null;
  }
  
  /**
   * Creates an attack chain record
   */
  private static async createAttackChain(
    tenantId: string,
    actorId: string,
    events: any[],
    pattern: any,
    tactics: MITRETactic[]
  ): Promise<AttackChain> {
    const killChainPhases = tactics.map(t => this.TACTIC_TO_KILL_CHAIN[t]);
    const uniquePhases = Array.from(new Set(killChainPhases));
    
    const eventSequence: AttackChainEvent[] = events.map((event, index) => ({
      id: `chain_event_${crypto.randomUUID()}`,
      chainId: '', // Will be set after chain creation
      order: index + 1,
      eventId: event.id,
      eventType: event.event_type,
      tactic: this.eventTypeToTactic(event.event_type) || 'execution',
      timestamp: new Date(event.detected_at),
      actorId: event.actor_id,
      targetId: event.target_id,
      details: event.details || {}
    }));
    
    const chain: AttackChain = {
      id: `chain_${crypto.randomUUID()}`,
      tenantId,
      name: pattern.name,
      description: pattern.description,
      tactics,
      techniques: [], // Would extract from event details
      killChainPhases: uniquePhases,
      relatedEventIds: events.map(e => e.id),
      eventSequence,
      confidence: Math.min(1.0, tactics.length / 4),
      severity: pattern.severity,
      attackVector: this.identifyAttackVector(tactics),
      targetResources: this.extractTargetResources(events),
      status: 'detected',
      detectedAt: new Date(),
      metadata: {
        actorId,
        eventCount: events.length,
        timeSpanMinutes: (new Date(events[events.length - 1].detected_at).getTime() - 
                         new Date(events[0].detected_at).getTime()) / 60000
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Update chain ID in event sequence
    for (const event of chain.eventSequence) {
      event.chainId = chain.id;
    }
    
    // Insert chain
    await supabase.from('attack_chains').insert({
      ...chain,
      kill_chain_phases: chain.killChainPhases,
      related_event_ids: chain.relatedEventIds,
      event_sequence: chain.eventSequence,
      target_resources: chain.targetResources,
      detected_at: chain.detectedAt.toISOString(),
      created_at: chain.createdAt.toISOString(),
      updated_at: chain.updatedAt.toISOString()
    });
    
    console.log(`[AttackChain] 🚨 Attack chain detected: ${chain.name} (${chain.severity})`);
    return chain;
  }
  
  /**
   * Identifies attack vector
   */
  private static identifyAttackVector(tactics: MITRETactic[]): string {
    if (tactics.includes('initial_access')) return 'External access';
    if (tactics.includes('credential_access')) return 'Credential compromise';
    if (tactics.includes('lateral_movement')) return 'Internal movement';
    return 'Unknown';
  }
  
  /**
   * Extracts target resources from events
   */
  private static extractTargetResources(events: any[]): string[] {
    const resources: Set<string> = new Set();
    
    for (const event of events) {
      if (event.target_type && event.target_id) {
        resources.add(`${event.target_type}:${event.target_id}`);
      }
    }
    
    return Array.from(resources);
  }
  
  /**
   * Gets active attack chains
   */
  static async getActiveChains(tenantId: string, limit: number = 50): Promise<AttackChain[]> {
    const { data } = await supabase
      .from('attack_chains')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('status', ['detected', 'investigating', 'confirmed'])
      .order('detected_at', { ascending: false })
      .limit(limit);
    
    return (data || []).map((c: any) => ({
      ...c,
      eventSequence: c.event_sequence || [],
      targetResources: c.target_resources || [],
      detectedAt: new Date(c.detected_at),
      completedAt: c.completed_at ? new Date(c.completed_at) : undefined,
      createdAt: new Date(c.created_at),
      updatedAt: new Date(c.updated_at)
    }));
  }
}