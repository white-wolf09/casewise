import http from 'http';
import app from '../backend/app.js';

let server;
let baseUrl;
let token;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token && !('Authorization' in reqHeaders)) {
      reqHeaders.Authorization = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Case Wise Backend & AI Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await test('GET /api/health returns status ok and AI config', async () => {
    const res = await request('GET', '/api/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.status === 'ok', 'Status should be ok');
    assert('ai' in res.body, 'Response should contain ai status');
  });

  // 2. Authentication
  await test('POST /api/auth/login rejects invalid credentials', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'maya@communitylegal.org',
      password: 'wrong_password',
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.errors?.form, 'Should return form error');
  });

  await test('POST /api/auth/login succeeds with Maya credentials', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'maya@communitylegal.org',
      password: 'Demo@12345',
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.token, 'Should return JWT token');
    assert(res.body.user?.email === 'maya@communitylegal.org', 'User email should match');
    assert(res.body.user?.name === 'Maya Brooks', 'User name should match');
    token = res.body.token; // Save token for subsequent tests
  });

  await test('Protected routes reject requests without token', async () => {
    const res = await request('GET', '/api/cases', null, { Authorization: '' });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // 3. Dashboard
  await test('GET /api/dashboard returns stats, deadlines, and cases', async () => {
    const res = await request('GET', '/api/dashboard');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.stats?.activeCases >= 5, 'Stats should include active cases');
    assert(Array.isArray(res.body.deadlines), 'Deadlines should be an array');
    assert(Array.isArray(res.body.cases), 'Cases should be an array');
  });

  // 4. Cases
  await test('GET /api/cases returns all active cases', async () => {
    const res = await request('GET', '/api/cases');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body) && res.body.length >= 5, 'Should return list of cases');
    assert(res.body.some((c) => c.caseId === 'LA-2048'), 'Should include LA-2048');
  });

  await test('GET /api/cases/:caseId returns full case detail with supervisor, timeline, facts, flags', async () => {
    const res = await request('GET', '/api/cases/LA-2048');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.caseId === 'LA-2048', 'Case ID should match');
    assert(res.body.meta?.supervisor, 'Supervisor should not be empty');
    assert(Array.isArray(res.body.facts) && res.body.facts.length >= 4, 'Facts should have auto-extracted items');
    assert(Array.isArray(res.body.documents), 'Documents should be an array');
    assert(Array.isArray(res.body.checklist), 'Checklist should be an array');
    assert(Array.isArray(res.body.flags) && res.body.flags.length >= 2, 'Flags should contain attention items');
    assert(Array.isArray(res.body.timeline) && res.body.timeline.length >= 3, 'Timeline should have milestones');

    // Also verify LA-2027 has supervisor, timeline, flags
    const res2027 = await request('GET', '/api/cases/LA-2027');
    assert(res2027.status === 200, 'LA-2027 should return 200');
    assert(res2027.body.meta?.supervisor, 'LA-2027 should have supervisor');
    assert(res2027.body.flags.length === 2, 'LA-2027 should have 2 open flags');
    assert(res2027.body.timeline.length >= 2, 'LA-2027 should have timeline');

    // Also verify LA-2031 has supervisor, timeline, checklist
    const res2031 = await request('GET', '/api/cases/LA-2031');
    assert(res2031.status === 200, 'LA-2031 should return 200');
    assert(res2031.body.meta?.supervisor, 'LA-2031 should have supervisor');
    assert(res2031.body.timeline.length >= 2, 'LA-2031 should have timeline');
    assert(res2031.body.checklist.length >= 4, 'LA-2031 should have checklist');
  });

  await test('GET /api/cases/:caseId rejects invalid case ID', async () => {
    const res = await request('GET', '/api/cases/LA-9999');
    assert(res.status === 400, `Expected 400 for non-existent case, got ${res.status}`);
  });

  let createdCaseId;
  await test('POST /api/cases creates a new case with AI intake assessment, supervisor, timeline, flags, facts', async () => {
    const res = await request('POST', '/api/cases', {
      clientFirst: 'Carlos',
      clientLast: 'Mendoza',
      type: 'Housing · Eviction',
      language: 'Spanish',
      assignee: 'Maya Brooks',
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.clientName === 'Carlos Mendoza', 'Client name should match');
    assert(res.body.caseId.startsWith('LA-'), 'Should generate LA- case ID');
    createdCaseId = res.body.caseId;

    // Verify the newly created case has full detail (supervisor, timeline, flags, facts, checklist)
    const detailRes = await request('GET', `/api/cases/${createdCaseId}`);
    assert(detailRes.status === 200, 'Created case detail should return 200');
    assert(detailRes.body.meta?.supervisor, 'Created case should have supervisor');
    assert(detailRes.body.meta?.nextDeadline, 'Created case should have next deadline');
    assert(Array.isArray(detailRes.body.flags) && detailRes.body.flags.length >= 1, 'Created case should have initial flags');
    assert(Array.isArray(detailRes.body.facts) && detailRes.body.facts.length >= 4, 'Created case should have facts / AI suggestions');
    assert(Array.isArray(detailRes.body.timeline) && detailRes.body.timeline.length >= 2, 'Created case should have timeline milestones');
    assert(Array.isArray(detailRes.body.checklist) && detailRes.body.checklist.length >= 4, 'Created case should have checklist');
  });

  await test('POST /api/cases/:caseId/checklist/toggle toggles an item', async () => {
    const res = await request('POST', '/api/cases/LA-2048/checklist/toggle', {
      label: 'Proof of service',
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.label === 'Proof of service', 'Checklist label should match');
    assert(res.body.done === true, 'Item should be toggled to true');
  });

  // 5. AI Functionality (Casewise Assist)
  await test('POST /api/cases/:caseId/ask (Casewise Assist AI) searches uploaded documents and extracts related data', async () => {
    // Query 1: Monthly rent
    const resRent = await request('POST', '/api/cases/LA-2048/ask', {
      question: 'What is the monthly rent?',
    });
    assert(resRent.status === 200, `Expected 200, got ${resRent.status}`);
    assert(resRent.body.answer && resRent.body.answer.includes('1,240'), 'Answer should mention $1,240 rent');
    assert(Array.isArray(resRent.body.facts) && resRent.body.facts.length >= 2, 'Should return multiple related facts');
    assert(Array.isArray(resRent.body.documents) && resRent.body.documents.length >= 2, 'Should return multiple matching documents');
    assert(resRent.body.documents.some((d) => d.meta && d.meta.toLowerCase().includes('1,240')), 'Document meta should contain specific rent excerpt from file');

    // Query 2: Service date and notice conflict
    const resNotice = await request('POST', '/api/cases/LA-2048/ask', {
      question: 'When was the notice served and is there a conflict?',
    });
    assert(resNotice.status === 200, `Expected 200, got ${resNotice.status}`);
    assert(resNotice.body.answer && resNotice.body.answer.length > 15, 'Answer should describe the service date findings');
    assert(Array.isArray(resNotice.body.facts) && resNotice.body.facts.length >= 1, 'Should extract related service facts');
    assert(Array.isArray(resNotice.body.documents) && resNotice.body.documents.length >= 1, 'Should cite relevant documents');
  });

  await test('POST /api/cases/:caseId/documents processes uploaded documents and updates checklist', async () => {
    const res = await request('POST', `/api/cases/${createdCaseId}/documents`, {
      files: [
        { name: 'Lease agreement.pdf', size: 1048576 },
        { name: 'Notice to Quit.pdf', size: 524288 },
      ],
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.added === 2, 'Should add 2 files');

    // Verify detail reflects uploaded files and checklist update
    const detailRes = await request('GET', `/api/cases/${createdCaseId}`);
    assert(detailRes.body.documents.length >= 2, 'Documents should be in detail');
    assert(
      detailRes.body.checklist.some((c) => c.label.toLowerCase().includes('lease') && c.done === true),
      'Checklist item for lease should be marked done'
    );
  });

  // 6. Review Queue & Critical Conflict Business Logic
  await test('GET /api/reviews returns review queue', async () => {
    const res = await request('GET', '/api/reviews');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body) && res.body.length >= 1, 'Should return reviews list');
  });

  await test('GET /api/reviews/:id returns proposal and conflict details', async () => {
    const res = await request('GET', '/api/reviews/r1');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.id === 'r1', 'Review ID should match');
    assert(res.body.conflict !== null, 'r1 should have an open conflict initially');
  });

  await test('POST /api/reviews/r1/decision REJECTS approval when conflict is open', async () => {
    const res = await request('POST', '/api/reviews/r1/decision', {
      decision: 'approve',
      note: 'Attempting approval with conflict',
    });
    assert(res.status === 400, `Expected 400 due to conflict, got ${res.status}`);
    assert(res.body.errors?.decision, 'Should return conflict validation error');
  });

  await test('POST /api/cases/:caseId/flags/:flagId/resolve clears conflict and allows approval', async () => {
    // Resolve critical conflict f1
    const flagRes = await request('POST', '/api/cases/LA-2048/flags/f1/resolve');
    assert(flagRes.status === 200, `Expected 200, got ${flagRes.status}`);

    // Now review r1 conflict should be cleared and approval should succeed
    const approveRes = await request('POST', '/api/reviews/r1/decision', {
      decision: 'approve',
      note: 'Conflict resolved, approved for filing.',
    });
    assert(approveRes.status === 200, `Expected 200, got ${approveRes.status}`);
    assert(approveRes.body.ok === true, 'Approval should succeed');
  });

  await test('POST /api/reviews/r2/decision requires note when returning', async () => {
    const res = await request('POST', '/api/reviews/r2/decision', {
      decision: 'return',
      note: '', // missing note
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.body.errors?.note, 'Should require note when returning');
  });

  await test('POST /api/reviews/r2/decision returns proposal when note is provided', async () => {
    const res = await request('POST', '/api/reviews/r2/decision', {
      decision: 'return',
      note: 'Please verify entry date with client passport.',
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.decision === 'return', 'Decision should be return');
  });

  // 7. Search
  await test('GET /api/search finds matching cases', async () => {
    const res = await request('GET', '/api/search?q=Maria');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body) && res.body.length > 0, 'Should find matching cases');
    assert(res.body[0].clientName === 'Maria Hernandez', 'Should match Maria Hernandez');
  });

  // 8. Notifications
  await test('GET /api/notifications returns counts and deadlines', async () => {
    const res = await request('GET', '/api/notifications');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof res.body.reviews === 'number', 'Reviews should be a number');
    assert(Array.isArray(res.body.deadlines), 'Deadlines should be an array');
  });

  // 9. Reports
  await test('GET /api/reports returns kpis, weeks, and targets', async () => {
    const res = await request('GET', '/api/reports');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body.kpis), 'KPIs should be an array');
    assert(Array.isArray(res.body.weeks), 'Weeks should be an array');
    assert(Array.isArray(res.body.targets), 'Targets should be an array');
  });

  console.log(`\n========================================`);
  console.log(`🏁 Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Start temporary test server
server = app.listen(0, async () => {
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  try {
    await runTests();
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
