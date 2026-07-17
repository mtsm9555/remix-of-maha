import { SecretsManager } from './SecretsManager.server';

export const RotationEngine = {
  async rotateDueSecrets(): Promise<number> {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data } = await supabaseAdmin.from('secrets' as never)
      .select('id, tenant_id')
      .eq('rotation_enabled', true)
      .eq('is_revoked', false)
      .lte('next_rotation_at', new Date().toISOString());
    let rotated = 0;
    for (const row of (data ?? []) as Array<{ id: string; tenant_id: string }>) {
      try {
        await SecretsManager.rotateSecret(row.id, 'system', 'scheduled');
        rotated++;
      } catch (e) {
        console.error('[RotationEngine] rotate failed', row.id, e);
      }
    }
    return rotated;
  },
};