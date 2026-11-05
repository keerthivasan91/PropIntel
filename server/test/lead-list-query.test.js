import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLeadListQueries } from '../src/services/lead-list-query.js';

test('ranks analysed leads by latest score and places unanalysed leads last', () => {
  const queries = buildLeadListQueries();

  assert.match(queries.listSql, /MAX\(analysis_version\)/);
  assert.match(queries.listSql, /latest_analysis\.lead_score DESC/);
  assert.match(
    queries.listSql,
    /CASE WHEN latest_analysis\.lead_score IS NULL THEN 1 ELSE 0 END ASC/
  );
  assert.deepEqual(queries.parameters, []);
});

test('keeps search and status filters parameterized while preserving priority order', () => {
  const queries = buildLeadListQueries({
    search: 'Sarjapur',
    status: 'qualified'
  });

  assert.match(queries.countSql, /l\.name LIKE \?/);
  assert.match(queries.countSql, /l\.status = \?/);
  assert.deepEqual(queries.parameters, [
    '%Sarjapur%',
    '%Sarjapur%',
    '%Sarjapur%',
    'qualified'
  ]);
  assert.match(queries.listSql, /ORDER BY CASE WHEN latest_analysis\.lead_score IS NULL/);
});
