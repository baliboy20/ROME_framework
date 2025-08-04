import { promises as fs } from 'fs';
import { join } from 'path';
import type { AuthTokens } from '@/types/auth.types.js';

/**
 * Utility to load existing Google OAuth tokens from token.json file
 * This helps migrate from existing token files to the new AuthService system
 */
export class ExistingTokenLoader {
  
  /**
   * Load tokens from the existing token.json file format
   */
  static async loadFromTokenFile(tokenFilePath: string): Promise<AuthTokens | null> {
    try {
      const tokenContent = await fs.readFile(tokenFilePath, 'utf8');
      const tokenData = JSON.parse(tokenContent);
      
      // Handle the existing token.json format
      if (tokenData.type === 'authorized_user') {
        return {
          accessToken: tokenData.access_token || '', // May be empty/expired
          refreshToken: tokenData.refresh_token,
          expiryDate: tokenData.expiry_date || Date.now() - 1000, // Set as expired to force refresh
          tokenType: 'Bearer',
          scope: 'https://www.googleapis.com/auth/gmail.readonly'
        };
      }
      
      return null;
    } catch (error) {
      console.warn('[ExistingTokenLoader] Could not load existing token file:', error);
      return null;
    }
  }
  
  /**
   * Pre-populate AuthService with existing refresh token for a user
   */
  static async migrateExistingToken(
    authService: any, 
    userId: string, 
    tokenFilePath: string
  ): Promise<boolean> {
    try {
      const existingTokens = await this.loadFromTokenFile(tokenFilePath);
      
      if (existingTokens && existingTokens.refreshToken) {
        // Save the existing refresh token to the new storage system
        await authService.tokenStorage.save(userId, existingTokens);
        
        console.log(`[ExistingTokenLoader] Migrated existing refresh token for user: ${userId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[ExistingTokenLoader] Failed to migrate existing token:', error);
      return false;
    }
  }
}

/**
 * Helper function to migrate the existing token.json to the new AuthService
 * Call this during application startup if needed
 */
export async function migrateExistingGmailToken(authService: any): Promise<void> {
  // Calculate correct path from backend directory to PROJECT/user_docs/token.json
  const tokenPath = join(process.cwd(), '../../PROJECT/user_docs/token.json');
  const defaultUserId = 'default-user'; // You can change this based on your needs
  
  try {
    const migrated = await ExistingTokenLoader.migrateExistingToken(
      authService, 
      defaultUserId, 
      tokenPath
    );
    
    if (migrated) {
      console.log('✅ Successfully migrated existing Gmail token');
      console.log(`   User ID: ${defaultUserId}`);
      console.log('   The existing refresh token is now available for automatic token refresh');
    }
  } catch (error) {
    console.warn('⚠️  Could not migrate existing token - this is normal for fresh setups');
  }
}