import { OAuth2Client } from 'google-auth-library';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string | undefined;
  expiryDate?: number | undefined;
  scope?: string | undefined;
  tokenType?: string | undefined;
}

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface AuthState {
  state: string;
  codeVerifier?: string;
  codeChallenge?: string;
  expiresAt: Date;
}

export interface AuthorizedUser {
  client: OAuth2Client;
  tokens: AuthTokens;
  email?: string | undefined;
  userId?: string | undefined;
}

export interface TokenStorage {
  save(userId: string, tokens: AuthTokens): Promise<void>;
  load(userId: string): Promise<AuthTokens | null>;
  remove(userId: string): Promise<void>;
  exists(userId: string): Promise<boolean>;
}

export interface AuthError extends Error {
  code?: string;
  status?: number;
}