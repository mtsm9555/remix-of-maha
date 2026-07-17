import type { APIDocumentation, APIEndpoint } from "./APIDocumentationTypes";

export class MarkdownGenerator {
  static generateMarkdown(documentation: APIDocumentation): string {
    let md = `# ${documentation.title}\n\n`;
    md += `**Version:** ${documentation.version}\n\n`;
    md += `${documentation.description}\n\n`;

    md += `## Table of Contents\n\n`;
    md += `- [Authentication](#authentication)\n`;
    md += `- [Base URL](#base-url)\n`;
    md += `- [Endpoints](#endpoints)\n`;
    for (const endpoint of documentation.endpoints) {
      const anchor = this.generateAnchor(endpoint);
      md += `  - [${endpoint.method} ${endpoint.path}](#${anchor})\n`;
    }
    md += `\n`;

    md += `## Authentication\n\n`;
    for (const auth of documentation.authMethods) {
      md += `### ${auth.name}\n\n${auth.description}\n\n`;
      if (auth.type === 'bearer') {
        md += `**Type:** Bearer Token\n\n**Header:** \`Authorization: Bearer <token>\`\n\n`;
      } else if (auth.type === 'api_key') {
        md += `**Type:** API Key\n\n**Location:** ${auth.apiKeyLocation}\n\n**Name:** \`${auth.apiKeyName}\`\n\n`;
      }
    }

    md += `## Base URL\n\n`;
    for (const server of documentation.servers) {
      md += `- \`${server.url}\`${server.description ? ` - ${server.description}` : ''}\n`;
    }
    md += `\n## Endpoints\n\n`;

    const grouped = this.groupByTag(documentation.endpoints);
    for (const [tag, endpoints] of Object.entries(grouped)) {
      md += `### ${tag}\n\n`;
      for (const endpoint of endpoints) md += this.generateEndpointMarkdown(endpoint);
    }
    return md;
  }

  private static generateEndpointMarkdown(endpoint: APIEndpoint): string {
    const anchor = this.generateAnchor(endpoint);
    let md = `#### ${endpoint.method} ${endpoint.path}\n\n<a id="${anchor}"></a>\n\n${endpoint.summary}\n\n`;
    if (endpoint.description) md += `${endpoint.description}\n\n`;

    if (endpoint.parameters.length > 0) {
      md += `**Parameters:**\n\n| Name | In | Type | Required | Description |\n|------|-----|------|----------|-------------|\n`;
      for (const p of endpoint.parameters) {
        md += `| \`${p.name}\` | ${p.in} | ${p.schema.type} | ${p.required ? 'Yes' : 'No'} | ${p.description || ''} |\n`;
      }
      md += `\n`;
    }

    if (endpoint.requestBody?.content['application/json']) {
      const ex = endpoint.requestBody.content['application/json'].example;
      if (ex) md += `**Request Body:**\n\n\`\`\`json\n${JSON.stringify(ex, null, 2)}\n\`\`\`\n\n`;
    }

    md += `**Responses:**\n\n`;
    for (const r of endpoint.responses) {
      md += `**${r.statusCode}** - ${r.description}\n\n`;
      const ex = r.content?.['application/json']?.example;
      if (ex) md += `\`\`\`json\n${JSON.stringify(ex, null, 2)}\n\`\`\`\n\n`;
    }
    md += `---\n\n`;
    return md;
  }

  private static groupByTag(endpoints: APIEndpoint[]): Record<string, APIEndpoint[]> {
    const grouped: Record<string, APIEndpoint[]> = {};
    for (const e of endpoints) {
      const tag = e.tags[0] || 'General';
      (grouped[tag] ||= []).push(e);
    }
    return grouped;
  }

  private static generateAnchor(endpoint: APIEndpoint): string {
    return `${endpoint.method.toLowerCase()}-${endpoint.path.replace(/[{}\/]/g, '-').replace(/^-|-$/g, '')}`;
  }
}