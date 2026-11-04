import { databasePool } from '../config/database.js';
import { httpError } from '../utils/httpError.js';
import { getLeadById } from './lead.service.js';
import { validateCreateTask, validateTaskUpdate } from '../validators/task.validator.js';

function requireDatabase() {
  if (!databasePool) {
    throw httpError(503, 'DATABASE_NOT_CONFIGURED', 'The database is not configured.');
  }
}

function normalizeId(value, label) {
  const id = String(value ?? '');
  if (!/^[1-9]\d{0,17}$/.test(id)) {
    throw httpError(400, 'INVALID_ID', label + ' must be a positive integer.');
  }
  return id;
}

function mapTask(row) {
  return { ...row, id: String(row.id), lead_id: String(row.lead_id) };
}

export async function createTaskForLead(leadIdValue, payload) {
  requireDatabase();
  const leadId = normalizeId(leadIdValue, 'Lead ID');
  await getLeadById(leadId);
  const task = validateCreateTask(payload);
  const connection = await databasePool.getConnection();
  let taskId;

  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'INSERT INTO follow_up_tasks (lead_id, title, description, due_at) VALUES (?, ?, ?, ?)',
      [leadId, task.title, task.description, task.due_at]
    );
    taskId = String(result.insertId);

    await connection.execute(
      "INSERT INTO lead_activities (lead_id, activity_type, description) VALUES (?, 'follow_up_task_created', ?)",
      [leadId, 'Follow-up task created: ' + task.title]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getTaskById(taskId);
}

export async function getTaskById(value) {
  requireDatabase();
  const id = normalizeId(value, 'Task ID');
  const sql = 'SELECT t.id, t.lead_id, l.name AS lead_name, t.title, t.description, ' +
    't.due_at, t.status, t.created_at, t.completed_at ' +
    'FROM follow_up_tasks t INNER JOIN leads l ON l.id = t.lead_id WHERE t.id = ? LIMIT 1';
  const [rows] = await databasePool.execute(sql, [id]);
  if (!rows.length) {
    throw httpError(404, 'TASK_NOT_FOUND', 'The requested follow-up task was not found.');
  }
  return mapTask(rows[0]);
}

export async function listTasks({
  status = '',
  due = '',
  leadId: leadIdValue = '',
  search = '',
  page = 1,
  limit = 20
} = {}) {
  requireDatabase();
  const conditions = [];
  const parameters = [];

  if (status) {
    conditions.push('t.status = ?');
    parameters.push(status);
  }
  if (leadIdValue) {
    conditions.push('t.lead_id = ?');
    parameters.push(normalizeId(leadIdValue, 'Lead ID'));
  }
  if (search) {
    const term = '%' + search + '%';
    conditions.push('(t.title LIKE ? OR t.description LIKE ? OR l.name LIKE ?)');
    parameters.push(term, term, term);
  }

  const now = new Date();
  const utcNow = now.toISOString().slice(0, 19).replace('T', ' ');
  const utcDate = now.toISOString().slice(0, 10);
  if (due === 'overdue') {
    conditions.push("t.status = 'pending' AND t.due_at IS NOT NULL AND t.due_at < ?");
    parameters.push(utcNow);
  } else if (due === 'today') {
    conditions.push("t.status = 'pending' AND DATE(t.due_at) = ?");
    parameters.push(utcDate);
  } else if (due === 'upcoming') {
    conditions.push("t.status = 'pending' AND t.due_at > ?");
    parameters.push(utcNow);
  } else if (due === 'no_date') {
    conditions.push("t.status = 'pending' AND t.due_at IS NULL");
  }

  const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const countSql = 'SELECT COUNT(*) AS total FROM follow_up_tasks t ' +
    'INNER JOIN leads l ON l.id = t.lead_id ' + whereClause;
  const [countRows] = await databasePool.execute(countSql, parameters);

  const listSql = 'SELECT t.id, t.lead_id, l.name AS lead_name, l.location AS lead_location, ' +
    't.title, t.description, t.due_at, t.status, t.created_at, t.completed_at ' +
    'FROM follow_up_tasks t INNER JOIN leads l ON l.id = t.lead_id ' +
    whereClause + " ORDER BY CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END, " +
    'CASE WHEN t.due_at IS NULL THEN 1 ELSE 0 END, t.due_at ASC, t.created_at DESC ' +
    'LIMIT ? OFFSET ?';
  const [rows] = await databasePool.execute(listSql, [...parameters, limit, (page - 1) * limit]);
  const total = Number(countRows[0].total);

  return {
    tasks: rows.map(mapTask),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

export async function updateTask(value, payload) {
  requireDatabase();
  const id = normalizeId(value, 'Task ID');
  const changes = validateTaskUpdate(payload);
  const connection = await databasePool.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      'SELECT id, lead_id, title, status FROM follow_up_tasks WHERE id = ? FOR UPDATE',
      [id]
    );
    if (!rows.length) {
      throw httpError(404, 'TASK_NOT_FOUND', 'The requested follow-up task was not found.');
    }

    const current = rows[0];
    const fields = ['title', 'description', 'due_at', 'status']
      .filter((field) => Object.hasOwn(changes, field));
    const assignments = fields.map((field) => field + ' = ?');
    const values = fields.map((field) => changes[field]);

    if (Object.hasOwn(changes, 'status')) {
      assignments.push('completed_at = ?');
      values.push(changes.status === 'completed' ? new Date() : null);
    }

    await connection.execute(
      'UPDATE follow_up_tasks SET ' + assignments.join(', ') + ' WHERE id = ?',
      [...values, id]
    );

    const activityType = changes.status === 'completed'
      ? 'follow_up_task_completed'
      : changes.status === 'cancelled'
        ? 'follow_up_task_cancelled'
        : 'follow_up_task_updated';
    const activityDescription = changes.status === 'completed'
      ? 'Follow-up task completed: ' + current.title
      : changes.status === 'cancelled'
        ? 'Follow-up task cancelled: ' + current.title
        : 'Follow-up task updated: ' + fields.join(', ') + '.';

    await connection.execute(
      'INSERT INTO lead_activities (lead_id, activity_type, description) VALUES (?, ?, ?)',
      [current.lead_id, activityType, activityDescription]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getTaskById(id);
}

export async function listLeadActivities(leadIdValue, { limit = 50 } = {}) {
  requireDatabase();
  const leadId = normalizeId(leadIdValue, 'Lead ID');
  await getLeadById(leadId);

  const [rows] = await databasePool.execute(
    'SELECT id, lead_id, activity_type, description, created_at ' +
    'FROM lead_activities WHERE lead_id = ? ORDER BY id DESC LIMIT ?',
    [leadId, limit]
  );
  return rows.reverse().map((row) => ({
    ...row,
    id: String(row.id),
    lead_id: String(row.lead_id)
  }));
}

export async function getTaskSummary() {
  requireDatabase();
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const [rows] = await databasePool.execute(
    "SELECT " +
    "SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending, " +
    "SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed, " +
    "SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled, " +
    "SUM(CASE WHEN status = 'pending' AND due_at IS NOT NULL AND due_at < ? THEN 1 ELSE 0 END) AS overdue " +
    'FROM follow_up_tasks',
    [now]
  );
  return Object.fromEntries(
    Object.entries(rows[0]).map(([key, value]) => [key, Number(value ?? 0)])
  );
}
