import { promises as fs } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { authSettings } from '@/config/auth.config.js';
export class TokenStorageService {
    storagePath;
    encryptionKey;
    algorithm = 'aes-256-gcm';
    constructor(storagePath) {
        this.storagePath = storagePath || authSettings.tokenStoragePath;
        this.encryptionKey = this.deriveKey();
        this.ensureStorageDirectory();
    }
    deriveKey() {
        const secret = process.env.ENCRYPTION_SECRET || 'default-encryption-secret-change-me';
        return crypto.scryptSync(secret, 'salt', 32);
    }
    async ensureStorageDirectory() {
        try {
            await fs.mkdir(this.storagePath, { recursive: true });
        }
        catch (error) {
            console.error('Failed to create token storage directory:', error);
        }
    }
    encrypt(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }
    decrypt(encrypted, iv, authTag) {
        const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    getTokenFilePath(userId) {
        const hashedUserId = crypto.createHash('sha256').update(userId).digest('hex');
        return join(this.storagePath, `${hashedUserId}.token`);
    }
    async save(userId, tokens) {
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
        }
        catch (error) {
            throw new Error(`Failed to save tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async load(userId) {
        try {
            const filePath = this.getTokenFilePath(userId);
            const fileContent = await fs.readFile(filePath, 'utf8');
            const storageData = JSON.parse(fileContent);
            const decrypted = this.decrypt(storageData.encrypted, storageData.iv, storageData.authTag);
            return JSON.parse(decrypted);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw new Error(`Failed to load tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async remove(userId) {
        try {
            const filePath = this.getTokenFilePath(userId);
            await fs.unlink(filePath);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw new Error(`Failed to remove tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
    async exists(userId) {
        try {
            const filePath = this.getTokenFilePath(userId);
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async listAllUsers() {
        try {
            const files = await fs.readdir(this.storagePath);
            return files.filter(file => file.endsWith('.token'));
        }
        catch {
            return [];
        }
    }
}
//# sourceMappingURL=TokenStorageService.js.map