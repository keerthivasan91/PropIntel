import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('admin APIs reject requests without an admin session', async () => {
  const paths = [
    '/api/leads',
    '/api/leads/summary',
    '/api/tasks',
    '/api/tasks/summary'
  ];

  for (const path of paths) {
    const response = await request(app).get(path);
    assert.equal(response.status, 401, path + ' should require admin authentication');
    assert.equal(response.body.error.code, 'ADMIN_AUTH_REQUIRED');
  }
});

test('admin session endpoint reports an anonymous visitor without exposing data', async () => {
  const response = await request(app).get('/api/auth/me');

  assert.equal(response.status, 200);
  assert.equal(response.body.data.authenticated, false);
  assert.equal(response.body.data.username, null);
});
