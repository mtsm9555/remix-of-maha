// src/backend/agents/departments/Operations/MonitoringAgent.ts
import { BaseAgent } from "../BaseAgent";

export class MonitoringAgent extends BaseAgent {
  constructor() {
    super({
      id: 'ops-monitoring-agent',
      name: 'Monitoring Agent',
      department: 'operations',
      role: 'System Monitoring & Observability Specialist',
      goal: 'Monitor system health, detect issues, and ensure reliability',
      tools: ['prometheus', 'grafana', 'datadog', 'new-relic', 'sentry', 'logs', 'alerts']
    });
  }

  protected buildPrompt(task: string, context: Record<string, any>): string {
    const systemType = context.systemType || 'application';
    const metrics = context.metrics || [];
    const alerts = context.alerts || [];
    const sla = context.sla || '99.9%';

    return `
You are the Monitoring Agent in the Operations Department of Maha AI OS.

**Your Role:**
You are an expert monitoring and observability specialist who ensures system reliability through comprehensive monitoring, alerting, and incident response.

**Your Capabilities:**
- Design monitoring strategies and dashboards
- Configure metrics collection (Prometheus, Datadog)
- Create alerting rules and escalation paths
- Analyze system performance and bottlenecks
- Design SLA/SLO monitoring
- Create incident response procedures
- Set up log aggregation and analysis
- Monitor infrastructure health (CPU, memory, disk, network)
- Track application performance (APM)
- Design health check endpoints

**Current Task:**
${task}

**System Type:** ${systemType}
**Key Metrics:** ${metrics.join(', ')}
**Active Alerts:** ${alerts.join(', ')}
**SLA Target:** ${sla}

**Context:**
${JSON.stringify(context, null, 2)}

**Instructions:**
1. Analyze the system and its critical components
2. Identify key metrics to monitor
3. Design appropriate alerting thresholds
4. Create monitoring dashboard layout
5. Set up health check endpoints
6. Define incident response procedures
7. Configure log aggregation
8. Suggest performance optimizations
9. Provide SLA/SLO tracking strategy

**Output Format:**
- Monitoring Strategy Overview
- Key Metrics to Track
- Alerting Rules & Thresholds
- Dashboard Design
- Health Check Endpoints
- Incident Response Procedure
- Log Aggregation Strategy
- Performance Recommendations
- SLA/SLO Tracking Plan
`;
  }

  protected async processResponse(response: string, context: Record<string, any>): Promise<any> {
    return {
      type: 'monitoring',
      strategy: this.extractSection(response, 'Monitoring Strategy'),
      metrics: this.extractMetrics(response),
      alertingRules: this.extractAlertingRules(response),
      dashboard: this.extractSection(response, 'Dashboard'),
      healthChecks: this.extractHealthChecks(response),
      incidentResponse: this.extractSection(response, 'Incident Response'),
      logs: this.extractSection(response, 'Log Aggregation'),
      recommendations: this.extractList(response, 'Performance'),
      slaTracking: this.extractSection(response, 'SLA'),
      taskCompleted: true
    };
  }

  private extractSection(response: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[\\s\\w]*:([\\s\\S]*?)(?=\\n\\n[A-Z][a-z]|$)`, 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractMetrics(response: string): any[] {
    const section = this.extractSection(response, 'Key Metrics');
    const lines = section.split('\n')
      .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
      .map(l => l.replace(/^[-•]\s*/, '').trim());
    
    return lines.map(line => {
      const parts = line.split(':');
      return {
        name: parts[0]?.trim() || line,
        description: parts[1]?.trim() || '',
        threshold: this.extractThreshold(line)
      };
    });
  }

  private extractAlertingRules(response: string): any[] {
    const section = this.extractSection(response, 'Alerting Rules');
    const rules = section.split(/\n\d+\.\s*|\n-\s*|\n•\s*/)
      .filter(s => s.trim().length > 10);
    
    return rules.map((rule, i) => ({
      id: i + 1,
      rule: rule.trim(),
      severity: this.extractSeverity(rule),
      action: this.extractAction(rule)
    }));
  }

  private extractHealthChecks(response: string): any[] {
    const section = this.extractSection(response, 'Health Check');
    const checks = section.split(/\n\d+\.\s*|\n-\s*|\n•\s*/)
      .filter(s => s.trim().length > 5);
    
    return checks.map((check, i) => ({
      endpoint: this.extractEndpoint(check),
      description: check.trim(),
      interval: this.extractInterval(check)
    }));
  }

  private extractList(response: string, sectionName: string): string[] {
    const section = this.extractSection(response, sectionName);
    return section.split('\n')
      .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
      .map(l => l.replace(/^[-•]\s*/, '').trim())
      .filter(l => l.length > 0);
  }

  private extractThreshold(text: string): string {
    const match = text.match(/(?:threshold|alert|warn)[:\s]+([^,\n]+)/i);
    return match ? match[1].trim() : '';
  }

  private extractSeverity(text: string): string {
    if (text.toLowerCase().includes('critical') || text.toLowerCase().includes('p1')) return 'critical';
    if (text.toLowerCase().includes('warning') || text.toLowerCase().includes('p2')) return 'warning';
    if (text.toLowerCase().includes('info') || text.toLowerCase().includes('p3')) return 'info';
    return 'warning';
  }

  private extractAction(text: string): string {
    const match = text.match(/(?:action|response|notify)[:\s]+([^,\n]+)/i);
    return match ? match[1].trim() : 'Notify on-call';
  }

  private extractEndpoint(text: string): string {
    const match = text.match(/\/[\w\-\/]+/);
    return match ? match[0] : '/health';
  }

  private extractInterval(text: string): string {
    const match = text.match(/(\d+)\s*(seconds?|secs?|s|minutes?|mins?|m)/i);
    return match ? `${match[1]}${match[2][0]}` : '30s';
  }
}