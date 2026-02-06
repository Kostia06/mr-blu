import { test, expect } from 'playwright/test';

test.describe('API Endpoints', () => {
  test('health endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
  });

  test('documents endpoint requires auth', async ({ request }) => {
    const response = await request.get('/api/documents/recent');
    // Should return 401 or redirect
    expect([401, 403, 302, 303]).toContain(response.status());
  });

  test('statistics endpoint requires auth', async ({ request }) => {
    const response = await request.get('/api/statistics');
    expect([401, 403, 302, 303]).toContain(response.status());
  });

  test('user profile endpoint requires auth', async ({ request }) => {
    const response = await request.put('/api/user/profile', {
      data: { name: 'test' },
    });
    expect([401, 403, 302, 303]).toContain(response.status());
  });

  test('document save endpoint requires auth', async ({ request }) => {
    const response = await request.put('/api/documents/save', {
      data: { type: 'invoice' },
    });
    expect([401, 403, 302, 303]).toContain(response.status());
  });

  test('voice transcribe endpoint requires auth', async ({ request }) => {
    const response = await request.post('/api/voice/transcribe');
    expect([400, 401, 403, 302, 303]).toContain(response.status());
  });

  test('document send endpoint requires auth', async ({ request }) => {
    const response = await request.post('/api/documents/send', {
      data: { document_id: 'test' },
    });
    expect([401, 403, 302, 303]).toContain(response.status());
  });

  test('auth callback exists', async ({ request }) => {
    const response = await request.get('/auth/callback');
    // Should respond (even if error due to missing params)
    expect(response.status()).toBeLessThan(500);
  });

  test('auth logout endpoint exists', async ({ request }) => {
    const response = await request.post('/auth/logout');
    expect(response.status()).toBeLessThan(500);
  });

  test('unknown API routes return 404', async ({ request }) => {
    const response = await request.get('/api/nonexistent');
    expect(response.status()).toBe(404);
  });
});
