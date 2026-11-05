import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('admin APIs fail closed when no administrator session is present', async () => {
  const paths = [
    '/api/leads',
    '/api/leads/summary',
    '/api/tasks',
    '/api/tasks/summary'
  ];

  for (const path of paths) {
    const response = await request(app).get(path);
    assert.ok([401, 503].includes(response.status), path + ' should require admin authentication');
    assert.ok(['ADMIN_AUTH_REQUIRED', 'ADMIN_AUTH_NOT_CONFIGURED'].includes(response.body.error.code));
  }
});

test('admin session endpoint reports an anonymous visitor without exposing data', async () => {
  const response = await request(app).get('/api/auth/me');

  assert.equal(response.status, 200);
  assert.equal(response.body.data.authenticated, false);
  assert.equal(response.body.data.username, null);
  assert.equal(typeof response.body.data.configured, 'boolean');
});
