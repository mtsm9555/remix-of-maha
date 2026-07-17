import * as crypto from 'crypto';
import type { EncryptionAlgorithm, EncryptedValue, EncryptionContext } from "./DataEncryptionTypes";
import { EncryptionAuditLogger } from "./EncryptionAuditLogger.server";

export class EncryptionEngine {
  private static masterKey: Buffer | null = null;

  static initialize(masterKeyHex?: string): void {
    const hex = masterKeyHex || process.env.ENCRYPTION_MASTER_KEY;
    if (!hex) throw new Error('ENCRYPTION_MASTER_KEY not provided');
    this.masterKey = Buffer.from(hex, 'hex');
  }

  private static ensureInit(): void {
    if (!this.masterKey) this.initialize();
  }

  static async encrypt(
    plaintext: string,
    keyMaterial: string,
    algorithm: EncryptionAlgorithm,
    keyVersion: number,
    context: EncryptionContext,
  ): Promise<EncryptedValue> {
    const iv = crypto.randomBytes(16);
    const keyBuffer = Buffer.from(keyMaterial, 'hex');
    let ciphertext: string;
    let authTag: string | undefined;

    if (algorithm === 'AES-256-GCM') {
      const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
      ciphertext = cipher.update(plaintext, 'utf8', 'hex');
      ciphertext += cipher.final('hex');
      authTag = cipher.getAuthTag().toString('hex');
    } else if (algorithm === 'AES-256-CBC') {
      const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
      ciphertext = cipher.update(plaintext, 'utf8', 'hex');
      ciphertext += cipher.final('hex');
    } else {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    const encrypted: EncryptedValue = {
      ciphertext,
      iv: iv.toString('hex'),
      authTag,
      keyVersion,
      algorithm,
      encryptedAt: new Date(),
    };

    await EncryptionAuditLogger.log({
      tenantId: context.tenantId,
      action: 'encrypt',
      actorId: context.userId || context.service,
      actorType: context.userId ? 'user' : 'service',
      tableName: context.tableName,
      fieldName: context.fieldName,
      success: true,
    });

    return encrypted;
  }

  static async decrypt(
    encrypted: EncryptedValue,
    keyMaterial: string,
    context: EncryptionContext,
  ): Promise<string> {
    const iv = Buffer.from(encrypted.iv, 'hex');
    const keyBuffer = Buffer.from(keyMaterial, 'hex');
    let plaintext: string;

    if (encrypted.algorithm === 'AES-256-GCM') {
      if (!encrypted.authTag) throw new Error('Auth tag required for GCM decryption');
      const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
      decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
      plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
      plaintext += decipher.final('utf8');
    } else if (encrypted.algorithm === 'AES-256-CBC') {
      const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
      plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
      plaintext += decipher.final('utf8');
    } else {
      throw new Error(`Unsupported algorithm: ${encrypted.algorithm}`);
    }

    await EncryptionAuditLogger.log({
      tenantId: context.tenantId,
      action: 'decrypt',
      actorId: context.userId || context.service,
      actorType: context.userId ? 'user' : 'service',
      tableName: context.tableName,
      fieldName: context.fieldName,
      success: true,
    });

    return plaintext;
  }

  static encryptWithMasterKey(plaintext: string): { encrypted: string; iv: string; authTag: string } {
    this.ensureInit();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey!, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encrypted, iv: iv.toString('hex'), authTag: cipher.getAuthTag().toString('hex') };
  }

  static decryptWithMasterKey(encryptedHex: string, ivHex: string, authTagHex: string): string {
    this.ensureInit();
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey!, iv);
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  static generateKey(algorithm: EncryptionAlgorithm): string {
    if (algorithm === 'AES-256-GCM' || algorithm === 'AES-256-CBC' || algorithm === 'ChaCha20-Poly1305') {
      return crypto.randomBytes(32).toString('hex');
    }
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }
}