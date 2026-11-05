import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

// Set isolated test credentials before app/config modules are imported.
process.env.ADMIN_USERNAME = 'propintel-ci-admin';
process.env.ADMIN_PASSWORD = 'propintel-ci-password-2026';
process.env.SESSION_SECRET = 'propintel-ci-session-secret-012345678901234567890123';

const { app } = await import('../src/app.js');

test('admin APIs reject requests without an administrator session', async () => {
  const paths = ['/api/leads', '/api/leads/summary', '/api/tasks', '/api/tasks/summary'];

  for (const path of paths) {
    const response = await request(app).get(path);
    assert.equal(response.status, 401, path + ' should require admin authentication');
    assert.equal(response.body.error.code, 'ADMIN_AUTH_REQUIRED');
  }
});

test('admin can sign in and receive a secure HTTP-only session cookie', async () => {
  const agent = request.agent(app);
  const login = await agent.post('/api/auth/login').send({
    username: 'propintel-ci-admin',
    password: 'propintel-ci-password-2026'
  });

  assert.equal(login.status, 200);
  assert.equal(login.body.data.authenticated, true);
  assert.match(login.headers['set-cookie'][0], /HttpOnly/i);
  assert.match(login.headers['set-cookie'][0], /SameSite=Strict/i);

  const session = await agent.get('/api/auth/me');
  assert.equal(session.status, 200);
  assert.equal(session.body.data.authenticated, true);
  assert.equal(session.body.data.username, 'propintel-ci-admin');

  const logout = await agent.post('/api/auth/logout');
  assert.equal(logout.status, 200);

  const afterLogout = await agent.get('/api/auth/me');
  assert.equal(afterLogout.body.data.authenticated, false);
});

test('invalid administrator credentials are rejected', async () => {
  const response = await request(app).post('/api/auth/login').send({
    username: 'propintel-ci-admin',
    password: 'incorrect-password'
  });

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'INVALID_CREDENTIALS');
});

test('admin session endpoint reports an anonymous visitor', async () => {
  const response = await request(app).get('/api/auth/me');
  assert.equal(response.status, 200);
  assert.equal(response.body.data.authenticated, false);
  assert.equal(response.body.data.configured, true);
});
