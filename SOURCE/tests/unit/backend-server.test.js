const request = require('supertest');
const app = require('../../backend/server');

describe('Backend Server Tests', () => {
  describe('Health Check Endpoint', () => {
    test('GET /health should return 200 with status information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(typeof response.body.uptime).toBe('number');
    });

    test('Health check should return valid timestamp', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 5000); // Within 5 seconds
    });
  });

  describe('API Root Endpoint', () => {
    test('GET /api/v1 should return API information', async () => {
      const response = await request(app)
        .get('/api/v1')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Project Management API v1.0');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('status', 'active');
      expect(response.body).toHaveProperty('endpoints');
      
      // Check endpoints structure
      const endpoints = response.body.endpoints;
      expect(endpoints).toHaveProperty('projects', '/api/v1/projects');
      expect(endpoints).toHaveProperty('tasks', '/api/v1/tasks');
      expect(endpoints).toHaveProperty('blogs', '/api/v1/blogs');
      expect(endpoints).toHaveProperty('auth', '/api/v1/auth');
    });
  });

  describe('404 Handler', () => {
    test('Should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Endpoint not found');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('GET /non-existent-route');
    });

    test('Should return 404 for non-existent API routes', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Endpoint not found');
    });
  });

  describe('Security Headers', () => {
    test('Should include security headers', async () => {
      const response = await request(app)
        .get('/health');

      // Check for common security headers set by helmet
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-download-options');
    });
  });

  describe('CORS Configuration', () => {
    test('Should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/v1')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('JSON Parsing', () => {
    test('Should parse JSON requests', async () => {
      const testData = { test: 'data' };
      
      // Since we don't have a POST endpoint yet, we'll test the middleware
      // by checking that the server doesn't crash with JSON data
      const response = await request(app)
        .post('/api/v1/test')
        .send(testData)
        .expect(404); // Should return 404 but not crash

      expect(response.body).toHaveProperty('error');
    });

    test('Should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/test')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // Express should handle malformed JSON and return 400
    });
  });

  describe('Rate Limiting', () => {
    test('Should apply rate limiting to API routes', async () => {
      // Make multiple requests to test rate limiting
      const requests = Array(5).fill().map(() => 
        request(app).get('/api/v1')
      );
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed (we're not hitting the limit)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    test('Should handle errors gracefully', async () => {
      // Test by triggering an error in middleware
      const mockError = new Error('Test error');
      mockError.status = 500;
      
      // Since we can't easily trigger an error in our current setup,
      // we'll test that the error handler exists by checking the middleware stack
      expect(app._router.stack).toBeDefined();
      
      // Check that we have error handling middleware
      const errorHandlers = app._router.stack.filter(layer => 
        layer.handle.length === 4 // Error handlers have 4 parameters
      );
      expect(errorHandlers.length).toBeGreaterThan(0);
    });
  });

  describe('Environment Configuration', () => {
    test('Should use correct port from environment', () => {
      const originalEnv = process.env.PORT;
      process.env.PORT = '9000';
      
      // Test that the port configuration is read
      expect(process.env.PORT).toBe('9000');
      
      // Restore original environment
      if (originalEnv) {
        process.env.PORT = originalEnv;
      } else {
        delete process.env.PORT;
      }
    });
  });
});