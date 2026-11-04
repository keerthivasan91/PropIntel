const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(API_BASE_URL + path, {
      ...options,
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
  return request('/api/leads', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateLead(id, payload) {
  return request('/api/leads/' + encodeURIComponent(id), {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}
