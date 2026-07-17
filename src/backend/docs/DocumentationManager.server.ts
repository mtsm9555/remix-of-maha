import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { APIDocumentation, APIDocumentationVersion } from "./APIDocumentationTypes";
import { OpenAPIGenerator } from "./OpenAPIGenerator";
import { MarkdownGenerator } from "./MarkdownGenerator";

function mapDoc(d: any): APIDocumentation {
  return {
    id: d.id,
    tenantId: d.tenant_id,
    title: d.title,
    version: d.version,
    description: d.description,
    servers: d.servers || [],
    authMethods: d.auth_methods || [],
    endpoints: d.endpoints || [],
    schemas: d.schemas || [],
    tags: d.tags || [],
    externalDocs: d.external_docs ?? undefined,
    createdAt: new Date(d.created_at),
    updatedAt: new Date(d.updated_at),
  };
}

export class DocumentationManager {
  static async createDocumentation(
    tenantId: string,
    data: Omit<APIDocumentation, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>,
  ): Promise<APIDocumentation> {
    const now = new Date();
    const doc: APIDocumentation = {
      id: `doc_${crypto.randomUUID()}`,
      tenantId,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await supabaseAdmin.from('api_documentation').insert({
      id: doc.id,
      tenant_id: doc.tenantId,
      title: doc.title,
      version: doc.version,
      description: doc.description,
      servers: doc.servers,
      auth_methods: doc.authMethods,
      endpoints: doc.endpoints,
      schemas: doc.schemas,
      tags: doc.tags,
      external_docs: doc.externalDocs ?? null,
    });

    await this.createVersion(doc.id, doc.version, doc);
    return doc;
  }

  static async getDocumentation(docId: string, tenantId: string): Promise<APIDocumentation | null> {
    const { data } = await supabaseAdmin
      .from('api_documentation')
      .select('*')
      .eq('id', docId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    return data ? mapDoc(data) : null;
  }

  static async getAllDocumentation(tenantId: string): Promise<APIDocumentation[]> {
    const { data } = await supabaseAdmin
      .from('api_documentation')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false });
    return (data || []).map(mapDoc);
  }

  static async exportOpenAPIJSON(docId: string, tenantId: string): Promise<string> {
    const doc = await this.getDocumentation(docId, tenantId);
    if (!doc) throw new Error('Documentation not found');
    return OpenAPIGenerator.exportAsJSON(OpenAPIGenerator.generateSpec(doc));
  }

  static async exportOpenAPIYAML(docId: string, tenantId: string): Promise<string> {
    const doc = await this.getDocumentation(docId, tenantId);
    if (!doc) throw new Error('Documentation not found');
    return OpenAPIGenerator.exportAsYAML(OpenAPIGenerator.generateSpec(doc));
  }

  static async exportMarkdown(docId: string, tenantId: string): Promise<string> {
    const doc = await this.getDocumentation(docId, tenantId);
    if (!doc) throw new Error('Documentation not found');
    return MarkdownGenerator.generateMarkdown(doc);
  }

  private static async createVersion(docId: string, version: string, documentation: APIDocumentation): Promise<void> {
    await supabaseAdmin.from('api_documentation_versions').update({ is_latest: false }).eq('doc_id', docId);
    const now = new Date();
    await supabaseAdmin.from('api_documentation_versions').insert({
      id: `ver_${crypto.randomUUID()}`,
      doc_id: docId,
      version,
      documentation: documentation as any,
      is_latest: true,
      published_at: now.toISOString(),
    });
  }

  static async getVersionHistory(docId: string, _tenantId: string): Promise<APIDocumentationVersion[]> {
    const { data } = await supabaseAdmin
      .from('api_documentation_versions')
      .select('*')
      .eq('doc_id', docId)
      .order('published_at', { ascending: false });
    return (data || []).map((v: any) => ({
      id: v.id,
      docId: v.doc_id,
      version: v.version,
      documentation: v.documentation,
      isLatest: v.is_latest,
      publishedAt: new Date(v.published_at),
      createdAt: new Date(v.created_at),
    }));
  }
}