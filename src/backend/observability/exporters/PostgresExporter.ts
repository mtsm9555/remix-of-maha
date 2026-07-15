export interface PgLikeClient {
  insert(table: string, row: Record<string, unknown>): Promise<unknown>;
}

export class PostgresExporter {
  constructor(private client?: PgLikeClient) {}

  async exportLog(row: Record<string, unknown>) {
    if (!this.client) return;
    await this.client.insert("logs", row);
  }

  async exportMetric(row: Record<string, unknown>) {
    if (!this.client) return;
    await this.client.insert("metrics", row);
  }

  async exportTrace(row: Record<string, unknown>) {
    if (!this.client) return;
    await this.client.insert("traces", row);
  }
}