export function buildLeadListQueries({ search = '', status = '' } = {}) {
  const conditions = [];
  const parameters = [];

  if (search) {
    const term = '%' + search + '%';
    conditions.push('(l.name LIKE ? OR l.location LIKE ? OR l.property_requirement LIKE ?)');
    parameters.push(term, term, term);
  }

  if (status) {
    conditions.push('l.status = ?');
    parameters.push(status);
  }

  const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const countSql = 'SELECT COUNT(*) AS total FROM leads l ' + whereClause;
  const listSql = 'SELECT l.id, l.name, l.location, l.property_requirement, l.budget_min, l.budget_max, ' +
    'l.buying_timeline, l.customer_message, l.status, l.created_at, l.updated_at, ' +
    'latest_analysis.lead_score, latest_analysis.priority ' +
    'FROM leads l ' +
    'LEFT JOIN (' +
    '  SELECT analysis.lead_id, analysis.lead_score, analysis.priority ' +
    '  FROM lead_analyses analysis ' +
    '  INNER JOIN (' +
    '    SELECT lead_id, MAX(analysis_version) AS latest_version ' +
    '    FROM lead_analyses GROUP BY lead_id' +
    '  ) latest_per_lead ON latest_per_lead.lead_id = analysis.lead_id ' +
    '    AND latest_per_lead.latest_version = analysis.analysis_version' +
    ') latest_analysis ON latest_analysis.lead_id = l.id ' +
    whereClause +
    ' ORDER BY CASE WHEN latest_analysis.lead_score IS NULL THEN 1 ELSE 0 END ASC, ' +
    'latest_analysis.lead_score DESC, l.created_at DESC, l.id DESC';

  return { countSql, listSql, parameters };
}
