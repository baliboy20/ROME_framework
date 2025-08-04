import { promises as fs } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import type { AuthTokens, TokenStorage } from '@/types/auth.types.js';
import { authSettings } from '@/config/auth.config.js';

export class TokenStorageService implements TokenStorage {
  private storagePath: string;
  private encryptionKey: Buffer;
  private algorithm = 'aes-256-gcm';

  constructor(storagePath?: string) {
    this.storagePath = storagePath || authSettings.tokenStoragePath;
    this.encryptionKey = this.deriveKey();
    this.ensureStorageDirectory();
  }

  private deriveKey(): Buffer {
    const secret = process.env.ENCRYPTION_SECRET || 'default-encryption-secret-change-me';
    return crypto.scryptSync(secret, 'salt', 32);
  }

  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create token storage directory:', error);
    }
  }

  private encrypt(data: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = (cipher as any).getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  private decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm, 
      this.encryptionKey, 
      Buffer.from(iv, 'hex')
    );
    
    (decipher as any).setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private getTokenFilePath(userId: string): string {
    const hashedUserId = crypto.createHash('sha256').update(userId).digest('hex');
    return join(this.storagePath, `${hashedUserId}.token`);
  }

  async save(userId: string, tokens: AuthTokens): Promise<void> {
    try {
      const tokenData = JSON.stringify(tokens);
      const { encrypted, iv, authTag } = this.encrypt(tokenData);
      
      const storageData = {
        encrypted,
        iv,
        authTag,
        timestamp: new Date().toISOString()
      };
      
      const filePath = this.getTokenFilePath(userId);
      await fs.writeFile(filePath, JSON.stringify(storageData, null, 2));
    } catch (error) {
      throw new Error(`Failed to save tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async load(userId: string): Promise<AuthTokens | null> {
    try {
      const filePath = this.getTokenFilePath(userId);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const storageData = JSON.parse(fileContent);
      
      const decrypted = this.decrypt(
        storageData.encrypted, 
        storageData.iv, 
        storageData.authTag
      );
      
      return JSON.parse(decrypted) as AuthTokens;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw new Error(`Failed to load tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async remove(userId: string): Promise<void> {
    try {
      const filePath = this.getTokenFilePath(userId);
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new Error(`Failed to remove tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  async exists(userId: string): Promise<boolean> {
    try {
      const filePath = this.getTokenFilePath(userId);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async listAllUsers(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.storagePath);
      return files.filter(file => file.endsWith('.token'));
    } catch {
      return [];
    }
  }
}