// src/backend/security/threat/ThreatIntelligenceManager.ts
import { createClient } from "@supabase/supabase-js";
import { IndicatorOfCompromise, ThreatFeed, IOCType, ThreatCategory, MITRETactic } from "./ThreatDetectionTypes";
import * as crypto from "crypto";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class ThreatIntelligenceManager {
  private static iocCache: Map<string, IndicatorOfCompromise> = new Map();
  private static lastRefresh: Date = new Date(0);
  private static readonly CACHE_TTL_MS = 300000; // 5 minutes
  
  /**
   * Registers a new IOC
   */
  static async registerIOC(
    tenantId: string,
    type: IOCType,
    value: string,
    category: ThreatCategory,
    options: {
      severity?: 'low' | 'medium' | 'high' | 'critical';
      confidence?: number;
      mitreTactics?: MITRETactic[];
      mitreTechniques?: string[];
      source?: string;
      sourceFeed?: string;
      description?: string;
      tags?: string[];
      expirationAt?: Date;
    } = {}
  ): Promise<IndicatorOfCompromise> {
    // Check for existing IOC
    const { data: existing } = await supabase
      .from('indicators_of_compromise')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('type', type)
      .eq('value', value)
      .eq('is_active', true)
      .single();
    
    if (existing) {
      // Update hit count
      await supabase
        .from('indicators_of_compromise')
        .update({
          hit_count: supabase.raw('hit_count + 1'),
          last_hit_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      return await this.getIOC(existing.id, tenantId) as IndicatorOfCompromise;
    }
    
    const ioc: IndicatorOfCompromise = {
      id: `ioc_${crypto.randomUUID()}`,
      tenantId,
      type,
      value,
      category,
      severity: options.severity || 'medium',
      confidence: options.confidence || 0.8,
      mitreTactics: options.mitreTactics || [],
      mitreTechniques: options.mitreTechniques || [],
      source: options.source || 'manual',
      sourceFeed: options.sourceFeed,
      description: options.description,
      tags: options.tags || [],
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      expirationAt: options.expirationAt,
      isActive: true,
      hitCount: 1,
      lastHitAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await supabase.from('indicators_of_compromise').insert({
      ...ioc,
      mitre_tactics: ioc.mitreTactics,
      mitre_techniques: ioc.mitreTechniques,
      first_seen_at: ioc.firstSeenAt.toISOString(),
      last_seen_at: ioc.lastSeenAt.toISOString(),
      expiration_at: ioc.expirationAt?.toISOString(),
      last_hit_at: ioc.lastHitAt?.toISOString(),
      created_at: ioc.createdAt.toISOString(),
      updated_at: ioc.updatedAt.toISOString()
    });
    
    // Update cache
    this.iocCache.set(`${type}:${value}`, ioc);
    
    console.log(`[ThreatIntel] Registered IOC: ${type}:${value} (${category})`);
    return ioc;
  }
  
  /**
   * Checks if a value matches any known IOC
   */
  static async checkIOC(
    tenantId: string,
    type: IOCType,
    value: string
  ): Promise<{ match: boolean; ioc?: IndicatorOfCompromise }> {
    await this.refreshCacheIfNeeded(tenantId);
    
    const cacheKey = `${type}:${value}`;
    const cached = this.iocCache.get(cacheKey);
    
    if (cached && cached.isActive) {
      return { match: true, ioc: cached };
    }
    
    // Query database
    const { data } = await supabase
      .from('indicators_of_compromise')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('type', type)
      .eq('value', value)
      .eq('is_active', true)
      .single();
    
    if (data) {
      const ioc = this.mapToIOC(data);
      this.iocCache.set(cacheKey, ioc);
      return { match: true, ioc };
    }
    
    return { match: false };
  }
  
  /**
   * Registers a threat feed
   */
  static async registerFeed(
    tenantId: string,
    name: string,
    feedType: ThreatFeed['feedType'],
    feedUrl: string,
    options: {
      description?: string;
      apiKey?: string;
      refreshIntervalMinutes?: number;
      iocTypes?: IOCType[];
      minConfidence?: number;
      autoImport?: boolean;
    } = {}
  ): Promise<ThreatFeed> {
    const feed: ThreatFeed = {
      id: `feed_${crypto.randomUUID()}`,
      tenantId,
      name,
      description: options.description,
      feedType,
      feedUrl,
      apiKey: options.apiKey,
      refreshIntervalMinutes: options.refreshIntervalMinutes || 60,
      iocTypes: options.iocTypes || ['ip', 'domain', 'hash_sha256'],
      minConfidence: options.minConfidence || 0.7,
      autoImport: options.autoImport !== false,
      isActive: true,
      totalIOCs: 0,
      newIOCsLastSync: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await supabase.from('threat_feeds').insert({
      ...feed,
      ioc_types: feed.iocTypes,
      created_at: feed.createdAt.toISOString(),
      updated_at: feed.updatedAt.toISOString()
    });
    
    console.log(`[ThreatIntel] Registered feed: ${name}`);
    return feed;
  }
  
  /**
   * Syncs a threat feed
   */
  static async syncFeed(feedId: string): Promise<{ imported: number; updated: number; errors: number }> {
    const { data: feed } = await supabase
      .from('threat_feeds')
      .select('*')
      .eq('id', feedId)
      .single();
    
    if (!feed) throw new Error('Feed not found');
    
    console.log(`[ThreatIntel] Syncing feed: ${feed.name}`);
    
    try {
      // Fetch feed data (in production, use appropriate client based on feedType)
      const feedData = await this.fetchFeedData(feed);
      
      let imported = 0;
      let updated = 0;
      let errors = 0;
      
      for (const ioc of feedData) {
        try {
          if (!feed.ioc_types.includes(ioc.type)) continue;
          if (ioc.confidence < feed.min_confidence) continue;
          
          const existing = await this.checkIOC(feed.tenant_id, ioc.type, ioc.value);
          
          if (existing.match) {
            updated++;
          } else {
            await this.registerIOC(feed.tenant_id, ioc.type, ioc.value, ioc.category, {
              severity: ioc.severity,
              confidence: ioc.confidence,
              mitreTactics: ioc.mitreTactics,
              mitreTechniques: ioc.mitreTechniques,
              source: 'threat_feed',
              sourceFeed: feed.name,
              description: ioc.description,
              tags: ioc.tags,
              expirationAt: ioc.expirationAt ? new Date(ioc.expirationAt) : undefined
            });
            imported++;
          }
        } catch (error) {
          errors++;
        }
      }
      
      // Update feed metadata
      await supabase
        .from('threat_feeds')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: errors === 0 ? 'success' : 'partial',
          total_iocs: supabase.raw(`total_iocs + ${imported}`),
          new_iocs_last_sync: imported,
          updated_at: new Date().toISOString()
        })
        .eq('id', feedId);
      
      console.log(`[ThreatIntel] Feed sync complete: ${imported} imported, ${updated} updated, ${errors} errors`);
      return { imported, updated, errors };
      
    } catch (error: any) {
      console.error(`[ThreatIntel] Feed sync failed:`, error.message);
      
      await supabase
        .from('threat_feeds')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', feedId);
      
      throw error;
    }
  }
  
  /**
   * Fetches feed data (mock implementation)
   */
  private static async fetchFeedData(feed: any): Promise<any[]> {
    // In production, implement actual feed fetching based on feedType
    // For this architecture, return mock data
    console.log(`[ThreatIntel] Would fetch from: ${feed.feed_url}`);
    
    return [
      {
        type: 'ip',
        value: '185.220.101.1',
        category: 'botnet' as ThreatCategory,
        severity: 'high' as const,
        confidence: 0.95,
        mitreTactics: ['command_and_control'] as MITRETactic[],
        mitreTechniques: ['T1071'],
        description: 'Known botnet C2 server',
        tags: ['botnet', 'c2']
      },
      {
        type: 'domain',
        value: 'malicious-example.com',
        category: 'phishing' as ThreatCategory,
        severity: 'high' as const,
        confidence: 0.90,
        mitreTactics: ['initial_access'] as MITRETactic[],
        mitreTechniques: ['T1566'],
        description: 'Phishing domain',
        tags: ['phishing']
      }
    ];
  }
  
  /**
   * Gets an IOC by ID
   */
  static async getIOC(iocId: string, tenantId: string): Promise<IndicatorOfCompromise | null> {
    const { data } = await supabase
      .from('indicators_of_compromise')
      .select('*')
      .eq('id', iocId)
      .eq('tenant_id', tenantId)
      .single();
    
    return data ? this.mapToIOC(data) : null;
  }
  
  /**
   * Gets all IOCs for a tenant
   */
  static async getIOCs(tenantId: string, options: {
    type?: IOCType;
    category?: ThreatCategory;
    severity?: string;
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<IndicatorOfCompromise[]> {
    let query = supabase
      .from('indicators_of_compromise')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('last_seen_at', { ascending: false })
      .limit(options.limit || 100);
    
    if (options.type) query = query.eq('type', options.type);
    if (options.category) query = query.eq('category', options.category);
    if (options.severity) query = query.eq('severity', options.severity);
    if (options.isActive !== undefined) query = query.eq('is_active', options.isActive);
    
    const { data } = await query;
    return (data || []).map(this.mapToIOC);
  }
  
  /**
   * Deactivates an expired IOC
   */
  static async cleanupExpiredIOCs(): Promise<number> {
    const { data: expired } = await supabase
      .from('indicators_of_compromise')
      .select('id')
      .eq('is_active', true)
      .lt('expiration_at', new Date().toISOString());
    
    if (!expired || expired.length === 0) return 0;
    
    await supabase
      .from('indicators_of_compromise')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in('id', expired.map(i => i.id));
    
    // Clear cache
    this.iocCache.clear();
    
    console.log(`[ThreatIntel] Deactivated ${expired.length} expired IOCs`);
    return expired.length;
  }
  
  /**
   * Refreshes cache if stale
   */
  private static async refreshCacheIfNeeded(tenantId: string): Promise<void> {
    const now = new Date();
    if (now.getTime() - this.lastRefresh.getTime() < this.CACHE_TTL_MS && this.iocCache.size > 0) {
      return;
    }
    
    const { data } = await supabase
      .from('indicators_of_compromise')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);
    
    this.iocCache.clear();
    
    for (const ioc of data || []) {
      const mapped = this.mapToIOC(ioc);
      this.iocCache.set(`${mapped.type}:${mapped.value}`, mapped);
    }
    
    this.lastRefresh = now;
  }
  
  /**
   * Maps database row to IOC
   */
  private static mapToIOC(data: any): IndicatorOfCompromise {
    return {
      ...data,
      mitreTactics: data.mitre_tactics || [],
      mitreTechniques: data.mitre_techniques || [],
      firstSeenAt: new Date(data.first_seen_at),
      lastSeenAt: new Date(data.last_seen_at),
      expirationAt: data.expiration_at ? new Date(data.expiration_at) : undefined,
      lastHitAt: data.last_hit_at ? new Date(data.last_hit_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}