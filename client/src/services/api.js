const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(API_BASE_URL + path, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error('Unable to reach the PropIntel API. Check that the backend is running.');
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message ?? 'The request could not be completed.');
  }
  return body.data;
}

export function checkAdminSession() {
  return request('/api/auth/me');
}

export function loginAdmin(credentials) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

export function logoutAdmin() {
  return request('/api/auth/logout', { method: 'POST' });
}

export function submitPublicEnquiry(payload) {
  return request('/api/public/enquiries', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function fetchLeadSummary() {
  return request('/api/leads/summary');
}

export function fetchLeads({ search = '', status = '', page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  return request('/api/leads?' + params.toString());
}

export function fetchLead(id) {
  return request('/api/leads/' + encodeURIComponent(id));
}

export function createLead(payload) {
  return request('/api/leads', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateLead(id, payload) {
  return request('/api/leads/' + encodeURIComponent(id), {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function analyzeLead(id) {
  return request('/api/leads/' + encodeURIComponent(id) + '/analyze', { method: 'POST' });
}

export function fetchLeadAnalyses(id) {
  return request('/api/leads/' + encodeURIComponent(id) + '/analyses');
}

export function fetchLeadConversation(id) {
  return request('/api/leads/' + encodeURIComponent(id) + '/conversations');
}

export function sendLeadMessage(id, message) {
  return request('/api/leads/' + encodeURIComponent(id) + '/chat', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
}

export function fetchTasks({ status = '', due = '', leadId = '', search = '', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  if (due) params.set('due', due);
  if (leadId) params.set('lead_id', leadId);
  if (search) params.set('search', search);
  return request('/api/tasks?' + params.toString());
}

export function fetchTaskSummary() {
  return request('/api/tasks/summary');
}

export function createTask(leadId, payload) {
  return request('/api/leads/' + encodeURIComponent(leadId) + '/tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateTask(id, payload) {
  return request('/api/tasks/' + encodeURIComponent(id), {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function fetchLeadTasks(leadId) {
  return request('/api/leads/' + encodeURIComponent(leadId) + '/tasks');
}

export function fetchLeadActivities(leadId) {
  return request('/api/leads/' + encodeURIComponent(leadId) + '/activities');
}
