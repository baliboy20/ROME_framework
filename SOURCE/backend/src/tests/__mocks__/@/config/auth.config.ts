export const authConfig = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  redirectUri: 'http://localhost:3000/api/auth/google/callback',
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ]
};

export const authSettings = {
  sessionSecret: 'test-session-secret',
  encryptionSecret: 'test-encryption-secret-32-chars-min',
  tokenStorage: {
    path: '/test/tokens',
    encryption: true
  }
};

export const validateAuthConfig = () => true;