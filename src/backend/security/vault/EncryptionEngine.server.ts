// AES-256-GCM using Web Crypto (Cloudflare Worker compatible)

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(hex.length / 2);
  const out = new Uint8Array(buf);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getKey(): Promise<CryptoKey> {
  const hex = process.env.VAULT_MASTER_KEY;
  if (!hex || hex.length !== 64) throw new Error('VAULT_MASTER_KEY must be 32-byte hex (64 chars)');
  return crypto.subtle.importKey('raw', hexToBytes(hex), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export const EncryptionEngine = {
  async encrypt(plaintext: string): Promise<{ encrypted: string; iv: string; authTag: string }> {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
    const ct = new Uint8Array(
      await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)),
    );
    // Web Crypto appends auth tag (16 bytes) to ciphertext
    const body = ct.slice(0, ct.length - 16);
    const tag = ct.slice(ct.length - 16);
    return { encrypted: bytesToHex(body), iv: bytesToHex(iv), authTag: bytesToHex(tag) };
  },
  async decrypt(encryptedHex: string, ivHex: string, authTagHex: string): Promise<string> {
    const key = await getKey();
    const body = hexToBytes(encryptedHex);
    const tag = hexToBytes(authTagHex);
    const combined = new Uint8Array(new ArrayBuffer(body.length + tag.length));
    combined.set(body, 0);
    combined.set(tag, body.length);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: hexToBytes(ivHex) }, key, combined);
    return new TextDecoder().decode(pt);
  },
};