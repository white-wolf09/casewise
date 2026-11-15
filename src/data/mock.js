// Mock backend: in-memory state that mirrors the Express API. Changes are saved to localStorage
// under "cw_mock" so they survive a reload. Delete this file once the real API runs.
import {
  ValidationError, assertCase, assertCaseId, assertChecklistLabel, assertDecision, assertFlagId,
  assertLogin, assertQuestion, assertReviewId, assertSearch, assertUpload, clean,
} from '../utils/validation.js';

const later = (value, ms = 250) => new Promise((r) => setTimeout(() => r(structuredClone(value)), ms));
const guard = (fn) => (...args) => { try { return fn(...args); } catch (err) { return Promise.reject(err); } };
const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const PALETTE = ['red', 'blue', 'lilac', 'green', 'peach'];
const RETURNED_TO_ME = 2;

const DEMO_USERS = [
  { email: 'maya@gmail.com', password: 'Demo@12345', name: 'Maya Brooks', role: 'Case Worker' },
  { email: 'john@gmail.com', password: '12345678', name: 'John Abraham', role: 'Case Worker' },
];

const SEED_CASES = [
  { caseId: 'LA-2048', clientName: 'Maria Hernandez', ini: 'MH', tone: 'red', type: 'Housing · Eviction', assignee: 'Maya Brooks', deadline: 'May 28', health: 68, openFlags: 2, status: 'Urgent' },
  { caseId: 'LA-2043', clientName: 'Darius Coleman', ini: 'DC', tone: 'blue', type: 'Public Benefits', assignee: 'Maya Brooks', deadline: 'Jun 04', health: 92, openFlags: 1, status: 'Active' },
  { caseId: 'LA-2039', clientName: 'Amina Yusuf', ini: 'AY', tone: 'lilac', type: 'Immigration', assignee: 'Sarah Patel', deadline: 'Jun 12', health: 84, openFlags: 2, status: 'Review' },
  { caseId: 'LA-2031', clientName: 'James Wilson', ini: 'JW', tone: 'green', type: 'Family Law', assignee: 'Maya Brooks', deadline: 'Jun 20', health: 100, openFlags: 0, status: 'Active' },
  { caseId: 'LA-2027', clientName: 'Li Wei', ini: 'LW', tone: 'peach', type: 'Housing · Repairs', assignee: 'M. Brooks', deadline: 'Jul 01', health: 76, openFlags: 2, status: 'Active' },
];

const SEED_DETAIL = {
  'LA-2048': {
    meta: { supervisor: 'Sarah Patel', nextDeadline: 'May 28 · Tomorrow', opened: 'May 20, 2025' },
    flags: [
      { id: 'f1', kind: 'crit', label: 'Critical conflict', title: 'Service date differs across two sources', body: 'Notice to Quit states May 10, while the client intake form states May 12. This may affect the response deadline.' },
      { id: 'f2', kind: 'miss', label: 'Missing document', title: 'Proof of service not found', body: 'Required by the eviction defense checklist. Ask the client or request a court copy.' },
    ],
    facts: [
      { label: 'Address', value: '1842 W. Monroe St, Apt 3B', source: 'Lease · p.1' },
      { label: 'Monthly rent', value: '$1,240.00', source: 'Rent ledger · p.4' },
      { label: 'Lease start', value: 'Aug 1, 2023', source: 'Lease · p.1' },
      { label: 'Notice served', value: 'May 10 or May 12 (conflict)', source: 'Notice · intake form' },
      { label: 'Household size', value: '3 people', source: 'Intake form' },
      { label: 'Primary language', value: 'Spanish', source: 'Intake form' },
    ],
    documents: [
      { name: 'Notice to Quit.pdf', meta: 'Notice · 3 pages', date: 'May 10, 2025' },
      { name: 'Lease agreement.pdf', meta: 'Lease · 12 pages', date: 'Aug 2023' },
      { name: 'Rent ledger.xlsx', meta: 'Ledger · 14 pages', date: 'Mar 2025' },
      { name: 'Client intake form.docx', meta: 'Intake · 4 pages', date: 'May 12, 2025' },
      { name: 'Local court rules.pdf', meta: 'Reference · 8 pages', date: 'Rule 6.2' },
    ],
    timeline: [
      { date: 'May 10', text: 'Notice to Quit dated and served (per notice)' },
      { date: 'May 12', text: 'Service date reported by client at intake' },
      { date: 'May 20', text: 'Case opened' },
      { date: 'May 27', text: 'Deadline proposal submitted for review' },
    ],
    checklist: [
      { label: 'Lease agreement', done: true },
      { label: 'Notice to Quit', done: true },
      { label: 'Rent ledger', done: true },
      { label: 'Client ID', done: true },
      { label: 'Income verification', done: true },
      { label: 'Proof of service', done: false },
      { label: 'Court complaint', done: false },
    ],
  },
};

const SEED_DEADLINES = [
  { id: 'd1', day: '28', month: 'May', title: 'Answer to eviction complaint', subtitle: 'Maria Hernandez · LA-2048', tag: 'Tomorrow', tone: 'red' },
  { id: 'd2', day: '30', month: 'May', title: 'Benefits appeal request', subtitle: 'Darius Coleman · LA-2043', tag: '3 days', tone: 'amber' },
  { id: 'd3', day: '02', month: 'Jun', title: 'Evidence submission', subtitle: 'Amina Yusuf · LA-2039', tag: '', tone: '' },
];

const SEED_REVIEWS = [
  { id: 'r1', title: 'Eviction response deadline', caseId: 'LA-2048', who: 'Maria Hernandez', priority: 'Critical review', submitted: 'May 27', date: 'May 28, 2025 at 5:00 PM', note: 'Response to the eviction complaint should be filed by this date.', evidence: [['Notice to Quit.pdf · Page 2', '“…served upon the tenant on May 10, 2025.”'], ['Local court rules · Rule 6.2', '“The tenant must answer within 18 calendar days.”']], conflict: 'Client reports service on May 12. Resolve before approval.' },
  { id: 'r2', title: 'Case chronology', caseId: 'LA-2039', who: 'Amina Yusuf', priority: 'High review', submitted: 'May 27', date: 'Jun 12, 2025 at 12:00 PM', note: 'Chronology should be verified before the immigration filing.', evidence: [['Intake form · Page 1', 'Arrival date recorded as March 3.'], ['Court notice · Page 2', 'Hearing set for June 10.']], conflict: null },
  { id: 'r3', title: 'Benefits appeal summary', caseId: 'LA-2043', who: 'Darius Coleman', priority: 'Standard review', submitted: 'May 26', date: 'Jun 04, 2025 at 5:00 PM', note: 'Appeal must be filed within the agency window.', evidence: [['Benefits notice · Page 1', 'Appeal must be filed within 60 days.'], ['Income statement · Page 2', 'Monthly income listed as $1,180.']], conflict: null },
];

// Restore saved changes, or start from the seed data
const saved = (() => { try { return JSON.parse(localStorage.getItem('cw_mock')); } catch { return null; } })();
let CASES = saved?.CASES ?? SEED_CASES;
let DETAIL = saved?.DETAIL ?? SEED_DETAIL;
let DEADLINES = saved?.DEADLINES ?? SEED_DEADLINES;
let REVIEWS = saved?.REVIEWS ?? SEED_REVIEWS;
let createdCount = saved?.createdCount ?? 0;

const persist = () => localStorage.setItem('cw_mock', JSON.stringify({ CASES, DETAIL, DEADLINES, REVIEWS, createdCount }));
const view = (c) => ({ ...c, openFlags: DETAIL[c.caseId] ? DETAIL[c.caseId].flags.length : c.openFlags });
const emptyDetail = (c) => ({
  meta: { supervisor: '—', nextDeadline: c.deadline, opened: today() },
  flags: [], facts: [], documents: [], timeline: [{ date: today(), text: 'Case opened' }], checklist: [],
});
const findCase = (id) => {
  const c = CASES.find((x) => x.caseId === id);
  if (!c) throw new ValidationError({ caseId: 'Case not found.' });
  return c;
};
const ensureDetail = (id) => {
  if (!DETAIL[id]) DETAIL[id] = emptyDetail(findCase(id));
  return DETAIL[id];
};

export const login = guard((input) => {
  const { email, password } = assertLogin(input);
  const user = DEMO_USERS.find((u) => u.email === email && u.password === password);
  if (!user) throw new Error('Incorrect email or password.');
  return later({ token: 'dev-token', user: { name: user.name, email: user.email, role: user.role } });
});

export const dashboard = () => {
  const flags = Object.values(DETAIL).flatMap((d) => d.flags);
  const totalFlags = CASES.reduce((n, c) => n + view(c).openFlags, 0);
  const critical = flags.filter((f) => f.kind === 'crit').length;
  return later({
    stats: {
      activeCases: CASES.length, activeAdded: createdCount, deadlinesWeek: DEADLINES.length,
      dueIn48h: DEADLINES.filter((d) => d.tag === 'Tomorrow').length,
      openFlags: totalFlags, critical, important: Math.max(0, totalFlags - critical),
      pendingReview: REVIEWS.length, returned: RETURNED_TO_ME,
    },
    deadlines: DEADLINES,
    cases: CASES.slice(0, 4).map(view),
  });
};

export const cases = () => later(CASES.map(view));

export const search = guard((q) => {
  const term = assertSearch(q).toLowerCase();
  if (!term) return later([]);
  return later(CASES.filter((c) => `${c.clientName} ${c.caseId} ${c.type}`.toLowerCase().includes(term)).slice(0, 6).map(view));
});

export const notifications = () => later({ reviews: REVIEWS.length, deadlines: DEADLINES.slice(0, 3) });

export const caseDetail = guard((caseId) => {
  const id = assertCaseId(caseId);
  const base = view(findCase(id));
  return later({ ...base, ...structuredClone(DETAIL[id] || emptyDetail(base)) });
});

export const createCase = guard((body) => {
  const v = assertCase(body);
  const num = Math.max(2100, ...CASES.map((c) => Number(c.caseId.slice(3)))) + 1;
  const n = CASES.length;
  const created = {
    caseId: `LA-${num}`, clientName: `${v.clientFirst} ${v.clientLast}`,
    ini: (v.clientFirst[0] + v.clientLast[0]).toUpperCase(), tone: PALETTE[n % PALETTE.length],
    type: v.type, assignee: v.assignee, deadline: '—', health: 100, openFlags: 0, status: 'Active',
  };
  CASES = [created, ...CASES];
  DETAIL[created.caseId] = {
    ...emptyDetail(created),
    facts: [
      { label: 'Case type', value: v.type, source: 'Intake form' },
      { label: 'Primary language', value: v.language, source: 'Intake form' },
    ],
  };
  createdCount += 1;
  persist();
  return later(created);
});

export const resolveFlag = guard((caseId, flagId) => {
  const id = assertCaseId(caseId);
  const fid = assertFlagId(flagId);
  const detail = ensureDetail(id);
  const flag = detail.flags.find((f) => f.id === fid);
  if (!flag) throw new ValidationError({ flag: 'Flag not found.' });
  detail.flags = detail.flags.filter((f) => f.id !== fid);
  // Resolving a critical conflict also clears it from the review queue
  if (flag.kind === 'crit') REVIEWS.forEach((r) => { if (r.caseId === id) r.conflict = null; });
  detail.timeline = [{ date: today(), text: `Flag resolved: ${flag.title}` }, ...detail.timeline];
  persist();
  return later({ ok: true });
});

export const toggleChecklist = guard((caseId, label) => {
  const id = assertCaseId(caseId);
  const name = assertChecklistLabel(label);
  const detail = ensureDetail(id);
  const item = detail.checklist.find((x) => x.label === name);
  if (!item) throw new ValidationError({ item: 'Checklist item not found.' });
  item.done = !item.done;
  persist();
  return later(item);
});

export const uploadDocuments = guard((caseId, files) => {
  const id = assertCaseId(caseId);
  const docs = assertUpload(files);
  const detail = ensureDetail(id);
  const fmt = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
  docs.forEach((d) => detail.documents.unshift({ name: d.name, meta: `${d.ext.toUpperCase()} · ${fmt(d.size)}`, date: today() }));
  detail.timeline = [{ date: today(), text: `Uploaded ${docs.length} file(s)` }, ...detail.timeline];
  persist();
  return later({ added: docs.length });
});

export const askEvidence = guard((caseId, question) => {
  const id = assertCaseId(caseId);
  const q = assertQuestion(question);
  const detail = ensureDetail(id);
  const terms = q.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 2);
  const hit = (text) => terms.some((t) => text.toLowerCase().includes(t));
  const facts = detail.facts.filter((f) => hit(`${f.label} ${f.value} ${f.source}`));
  const documents = detail.documents.filter((d) => hit(`${d.name} ${d.meta}`));
  const total = facts.length + documents.length;
  const answer = total
    ? `Found ${total} matching item${total > 1 ? 's' : ''} in this case.`
    : 'No matching facts or documents in this case. Try different words or upload more files.';
  return later({ answer, facts, documents });
});

export const reviews = () =>
  later(REVIEWS.map(({ id, title, caseId, who, priority, submitted }) => ({ id, title, caseId, who, priority, submitted })));

export const reviewDetail = guard((id) => {
  const reviewId = assertReviewId(id);
  const item = REVIEWS.find((r) => r.id === reviewId);
  if (!item) throw new ValidationError({ id: 'Review not found.' });
  return later(item);
});

export const decideReview = guard((id, decision, note) => {
  const reviewId = assertReviewId(id);
  const v = assertDecision({ decision, note });
  const item = REVIEWS.find((r) => r.id === reviewId);
  if (!item) throw new ValidationError({ id: 'Review not found.' });
  if (v.decision === 'approve' && item.conflict) {
    throw new ValidationError({ decision: 'Resolve the open conflict before approving.' });
  }
  REVIEWS = REVIEWS.filter((r) => r.id !== reviewId);
  persist();
  return later({ ok: true, decision: v.decision });
});

export const reports = () =>
  later({
    kpis: [
      { label: 'Median time to find evidence', value: '1m 42s', note: 'Down from 6m 10s baseline' },
      { label: 'Claims with a source', value: '97.8%', note: 'Across 1,240 facts' },
      { label: 'Conflicts caught', value: '93.1%', note: 'Before filing deadline' },
      { label: 'Drafts returned', value: '36%', note: 'Down from 48% last quarter' },
    ],
    weeks: [
      { week: 'W1', manual: 62, assisted: 38 }, { week: 'W2', manual: 58, assisted: 30 },
      { week: 'W3', manual: 55, assisted: 24 }, { week: 'W4', manual: 50, assisted: 20 },
      { week: 'W5', manual: 48, assisted: 17 }, { week: 'W6', manual: 46, assisted: 15 },
      { week: 'W7', manual: 44, assisted: 13 }, { week: 'W8', manual: 42, assisted: 12 },
    ],
    targets: [
      { label: 'Claims with a source', value: 97.8 },
      { label: 'Conflicts caught before filing', value: 93.1 },
      { label: 'Drafts returned for rework', value: 36 },
    ],
  });

export const login_users = DEMO_USERS.map(({ email, name }) => ({ email, name }));
