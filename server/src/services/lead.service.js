import { databasePool } from '../config/database.js';
import { httpError } from '../utils/httpError.js';
import { assertBudgetRange, validateLeadInput } from '../validators/lead.validator.js';

function requireDatabase() {
  if (!databasePool) {
    throw httpError(503, 'DATABASE_NOT_CONFIGURED', 'The database is not configured. Set the MySQL values in server/.env.');
  }
}

function normalizeLeadId(value) {
  const id = String(value ?? '');
  if (!/^[1-9]\d{0,17}$/.test(id)) {
    throw httpError(400, 'INVALID_LEAD_ID', 'Lead ID must be a positive integer.');
  }
  return id;
}

function toLead(row) {
  if (!row) return null;
  return {
    ...row,
    budget_min: row.budget_min === null ? null : Number(row.budget_min),
    budget_max: row.budget_max === null ? null : Number(row.budget_max)
  };
}

export async function createLead(payload) {
  requireDatabase();
  const lead = validateLeadInput(payload);
  assertBudgetRange(lead.budget_min, lead.budget_max);

  const connection = await databasePool.getConnection();
  let leadId;

  try {
    await connection.beginTransaction();

    const sql = 'INSERT INTO leads ' +
      '(name, location, property_requirement, budget_min, budget_max, buying_timeline, customer_message, status) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await connection.execute(sql, [
      lead.name,
      lead.location,
      lead.property_requirement,
      lead.budget_min ?? null,
      lead.budget_max ?? null,
      lead.buying_timeline,
      lead.customer_message,
      lead.status
    ]);

    leadId = String(result.insertId);
    await connection.execute(
      "INSERT INTO lead_activities (lead_id, activity_type, description) VALUES (?, 'lead_created', ?)",
      [leadId, 'Lead created in PropIntel.']
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getLeadById(leadId);
}

export async function listLeads({ search = '', status = '', page = 1, limit = 10 } = {}) {
  requireDatabase();

  const conditions = [];
  const parameters = [];

  if (search) {
    const term = '%' + search + '%';
    conditions.push('(name LIKE ? OR location LIKE ? OR property_requirement LIKE ?)');
    parameters.push(term, term, term);
  }
  if (status) {
    conditions.push('status = ?');
    parameters.push(status);
  }

  const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const offset = (page - 1) * limit;

  const [countRows] = await databasePool.execute(
    'SELECT COUNT(*) AS total FROM leads ' + whereClause,
    parameters
  );

  const listSql = 'SELECT id, name, location, property_requirement, budget_min, budget_max, ' +
    'buying_timeline, customer_message, status, created_at, updated_at ' +
    'FROM leads ' + whereClause + ' ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?';
  const [rows] = await databasePool.execute(listSql, [...parameters, limit, offset]);
  const total = Number(countRows[0].total);

  return {
    leads: rows.map(toLead),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getLeadById(value) {
  requireDatabase();
  const id = normalizeLeadId(value);

  const [rows] = await databasePool.execute(
    'SELECT id, name, location, property_requirement, budget_min, budget_max, ' +
    'buying_timeline, customer_message, status, created_at, updated_at ' +
    'FROM leads WHERE id = ? LIMIT 1',
    [id]
  );

  if (!rows.length) {
    throw httpError(404, 'LEAD_NOT_FOUND', 'The requested lead was not found.');
  }

  return toLead(rows[0]);
}

export async function updateLead(value, payload) {
  requireDatabase();
  const id = normalizeLeadId(value);
  const changes = validateLeadInput(payload, { partial: true });
  const connection = await databasePool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      'SELECT * FROM leads WHERE id = ? FOR UPDATE',
      [id]
    );

    if (!rows.length) {
      throw httpError(404, 'LEAD_NOT_FOUND', 'The requested lead was not found.');
    }

    const current = rows[0];
    const finalMinimum = Object.hasOwn(changes, 'budget_min') ? changes.budget_min : current.budget_min;
    const finalMaximum = Object.hasOwn(changes, 'budget_max') ? changes.budget_max : current.budget_max;
    assertBudgetRange(finalMinimum, finalMaximum);

    const allowedFields = [
      'name', 'location', 'property_requirement', 'budget_min',
      'budget_max', 'buying_timeline', 'customer_message', 'status'
    ];
    const fields = allowedFields.filter((field) => Object.hasOwn(changes, field));
    const assignments = fields.map((field) => field + ' = ?').join(', ');
    const values = fields.map((field) => changes[field]);

    await connection.execute(
      'UPDATE leads SET ' + assignments + ' WHERE id = ?',
      [...values, id]
    );

    await connection.execute(
      "INSERT INTO lead_activities (lead_id, activity_type, description) VALUES (?, 'lead_updated', ?)",
      [id, 'Lead updated: ' + fields.join(', ') + '.']
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return getLeadById(id);
}

export async function getLeadSummary() {
  requireDatabase();

  const [rows] = await databasePool.execute(
    'SELECT status, COUNT(*) AS count FROM leads GROUP BY status'
  );

  const byStatus = Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
  const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

  return { total, byStatus };
}
