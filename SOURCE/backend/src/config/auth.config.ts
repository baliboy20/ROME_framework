import type { AuthConfig } from '@/types/auth.types.js';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

export const authConfig: AuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ]
};

export const authSettings = {
  tokenExpiryBuffer: 5 * 60 * 1000, // 5 minutes before expiry
  stateExpiryTime: 10 * 60 * 1000, // 10 minutes
  maxRetries: 3,
  retryDelay: 1000,
  tokenStoragePath: process.env.TOKEN_STORAGE_PATH || join(process.cwd(), 'credentials', 'tokens')
};

export const validateAuthConfig = (): boolean => {
  const required = ['clientId', 'clientSecret'];
  const missing = required.filter(key => !authConfig[key as keyof AuthConfig]);
  
  if (missing.length > 0) {
    console.error(`Missing required auth configuration: ${missing.join(', ')}`);
    console.error('Please ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in your environment');
    return false;
  }
  
  return true;
};