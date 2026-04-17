const request = require('supertest');
const express = require('express');

// Mock config before requiring auth router
jest.mock('../src/config', () => ({
  jwt: { secret: 'test-secret-for-jest' },
  server: { port: 3001 }
}));

// Mock database query
jest.mock('../src/models', () => ({
  query: jest.fn(),
  initDatabase: jest.fn().mockResolvedValue(true)
}));

const authRouter = require('../src/routes/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('GET /api/auth/captcha', () => {
  test('returns captchaId and svg', async () => {
    const res = await request(app).get('/api/auth/captcha');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('captchaId');
    expect(res.body).toHaveProperty('svg');
    expect(res.body.svg).toContain('<svg');
    expect(typeof res.body.captchaId).toBe('string');
    expect(res.body.captchaId.length).toBeGreaterThan(8);
  });

  test('each call returns different captchaId', async () => {
    const [r1, r2] = await Promise.all([
      request(app).get('/api/auth/captcha'),
      request(app).get('/api/auth/captcha')
    ]);
    expect(r1.body.captchaId).not.toBe(r2.body.captchaId);
  });
});
