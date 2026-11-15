export const DEMO_USERS = [
  { email: 'maya@communitylegal.org', password: 'Demo@12345', name: 'Maya Brooks', role: 'Case Worker' },
  { email: 'john@communitylegal.org', password: '12345678', name: 'John Abraham', role: 'Case Worker' },
];

export const SEED_CASES = [
  { caseId: 'LA-2048', clientName: 'Maria Hernandez', ini: 'MH', tone: 'red', type: 'Housing · Eviction', assignee: 'Maya Brooks', deadline: 'May 28', health: 68, openFlags: 2, status: 'Urgent' },
  { caseId: 'LA-2043', clientName: 'Darius Coleman', ini: 'DC', tone: 'blue', type: 'Public Benefits', assignee: 'Maya Brooks', deadline: 'Jun 04', health: 92, openFlags: 1, status: 'Active' },
  { caseId: 'LA-2039', clientName: 'Amina Yusuf', ini: 'AY', tone: 'lilac', type: 'Immigration', assignee: 'Sarah Patel', deadline: 'Jun 12', health: 84, openFlags: 2, status: 'Review' },
  { caseId: 'LA-2031', clientName: 'James Wilson', ini: 'JW', tone: 'green', type: 'Family Law', assignee: 'Maya Brooks', deadline: 'Jun 20', health: 100, openFlags: 0, status: 'Active' },
  { caseId: 'LA-2027', clientName: 'Li Wei', ini: 'LW', tone: 'peach', type: 'Housing · Repairs', assignee: 'M. Brooks', deadline: 'Jul 01', health: 76, openFlags: 2, status: 'Active' },
];

export const SEED_DETAIL = {
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
  'LA-2043': {
    meta: { supervisor: 'Sarah Patel', nextDeadline: 'Jun 04 · 7 days', opened: 'May 15, 2025' },
    flags: [
      { id: 'f3', kind: 'miss', label: 'Missing document', title: 'Hearing notice copy needed', body: 'Copy of initial denial notice received from social services.' },
    ],
    facts: [
      { label: 'Monthly benefits', value: '$450.00', source: 'Agency notice · p.1' },
      { label: 'Household income', value: '$1,180.00', source: 'Pay stubs · p.2' },
      { label: 'Appeal deadline', value: 'Jun 04, 2025', source: 'Agency notice' },
      { label: 'Program', value: 'Supplemental Nutrition Assistance (SNAP)', source: 'Agency notice' },
      { label: 'Primary language', value: 'English', source: 'Intake form' },
    ],
    documents: [
      { name: 'Benefits notice.pdf', meta: 'Notice · 2 pages', date: 'May 14, 2025' },
      { name: 'Income statement.pdf', meta: 'Income · 3 pages', date: 'May 10, 2025' },
    ],
    timeline: [
      { date: 'May 14', text: 'Initial agency denial notice received' },
      { date: 'May 15', text: 'Case opened for benefits appeal' },
      { date: 'May 26', text: 'Benefits appeal summary submitted for review' },
    ],
    checklist: [
      { label: 'Agency notice', done: true },
      { label: 'Income statement', done: true },
      { label: 'Identification', done: true },
      { label: 'Appeal request form', done: false },
    ],
  },
  'LA-2039': {
    meta: { supervisor: 'Sarah Patel', nextDeadline: 'Jun 12 · 14 days', opened: 'May 02, 2025' },
    flags: [
      { id: 'f4', kind: 'crit', label: 'Critical conflict', title: 'Entry date discrepancy', body: 'Intake reports March 3 while border documentation indicates March 5.' },
      { id: 'f5', kind: 'miss', label: 'Missing document', title: 'Certified translation pending', body: 'Foreign birth certificate translation must be notarized.' },
    ],
    facts: [
      { label: 'Arrival date', value: 'March 3, 2025', source: 'Intake form · p.1' },
      { label: 'Hearing date', value: 'June 10, 2025', source: 'Court notice · p.2' },
      { label: 'Country of origin', value: 'Somalia', source: 'Intake form' },
      { label: 'Relief sought', value: 'Asylum / Withholding of Removal', source: 'Intake form' },
      { label: 'Primary language', value: 'Somali (Interpreter required)', source: 'Intake form' },
    ],
    documents: [
      { name: 'Intake form.pdf', meta: 'Intake · 5 pages', date: 'May 02, 2025' },
      { name: 'Court notice.pdf', meta: 'Court · 3 pages', date: 'May 05, 2025' },
      { name: 'Country conditions report.pdf', meta: 'Reference · 22 pages', date: 'May 18, 2025' },
    ],
    timeline: [
      { date: 'May 02', text: 'Case opened' },
      { date: 'May 05', text: 'Immigration court hearing notice logged' },
      { date: 'May 27', text: 'Chronology submitted for review' },
    ],
    checklist: [
      { label: 'Intake form', done: true },
      { label: 'Court notice', done: true },
      { label: 'Certified translation', done: false },
      { label: 'Declaration statement', done: false },
    ],
  },
  'LA-2031': {
    meta: { supervisor: 'Sarah Patel', nextDeadline: 'Jun 20 · Custody Conference', opened: 'May 18, 2025' },
    flags: [],
    facts: [
      { label: 'Matter', value: 'Custody & Child Support', source: 'Petition · p.1' },
      { label: 'Minor child', value: 'Leo Wilson (Age 6)', source: 'Birth Certificate' },
      { label: 'Current arrangement', value: 'Informal 50/50 shared parenting', source: 'Intake form' },
      { label: 'Mediation date', value: 'June 20, 2025 at 10:00 AM', source: 'Court Scheduling Order' },
      { label: 'Primary language', value: 'English', source: 'Intake form' },
    ],
    documents: [
      { name: 'Petition for custody.pdf', meta: 'Court Filing · 8 pages', date: 'May 18, 2025' },
      { name: 'Financial affidavit.pdf', meta: 'Affidavit · 4 pages', date: 'May 22, 2025' },
      { name: 'Parenting plan proposal.docx', meta: 'Draft · 6 pages', date: 'May 25, 2025' },
    ],
    timeline: [
      { date: 'May 18', text: 'Case opened · Initial custody petition filed' },
      { date: 'May 22', text: 'Financial disclosures verified and served' },
      { date: 'May 25', text: 'Parenting plan draft completed for attorney review' },
      { date: 'Jun 20', text: 'Court mediation / conciliation scheduled' },
    ],
    checklist: [
      { label: 'Petition / Complaint', done: true },
      { label: 'Financial affidavit', done: true },
      { label: 'Income documentation', done: true },
      { label: 'Proof of service', done: true },
      { label: 'Proposed parenting plan', done: true },
    ],
  },
  'LA-2027': {
    meta: { supervisor: 'Sarah Patel', nextDeadline: 'Jul 01 · Inspection Deadline', opened: 'Apr 28, 2025' },
    flags: [
      { id: 'f6', kind: 'crit', label: 'Critical conflict', title: 'Inspection notice timing discrepancy', body: 'Landlord asserts 24-hour notice was served on May 8, but tenant communication logs show entry occurred without prior notice.' },
      { id: 'f7', kind: 'miss', label: 'Missing document', title: 'City housing inspection report missing', body: 'Municipal code violation report has been requested from Department of Building Inspection but not yet received.' },
    ],
    facts: [
      { label: 'Address', value: '452 Elm St, Unit 2A', source: 'Lease · p.1' },
      { label: 'Reported habitability defects', value: 'Severe water intrusion and plumbing leaks', source: 'Tenancy complaint form' },
      { label: 'Notice of repair served', value: 'April 30, 2025', source: 'Certified mail receipt' },
      { label: 'Landlord response window', value: '30 calendar days (expired)', source: 'Housing Code § 14-2' },
      { label: 'Primary language', value: 'Mandarin (English interpreter needed)', source: 'Intake form' },
    ],
    documents: [
      { name: 'Lease agreement.pdf', meta: 'Lease · 10 pages', date: 'Apr 28, 2025' },
      { name: 'Notice of repair request.pdf', meta: 'Notice · 2 pages', date: 'Apr 30, 2025' },
      { name: 'Photo evidence (leak).jpg', meta: 'Image · 3.2 MB', date: 'May 02, 2025' },
      { name: 'Certified mail receipt.pdf', meta: 'Proof · 1 page', date: 'May 05, 2025' },
    ],
    timeline: [
      { date: 'Apr 28', text: 'Case opened for tenant habitability defense' },
      { date: 'Apr 30', text: 'Formal 30-day notice of repair served via certified mail' },
      { date: 'May 08', text: 'Unscheduled landlord entry reported by client' },
      { date: 'May 20', text: 'Request filed for city municipal housing inspection' },
    ],
    checklist: [
      { label: 'Lease agreement', done: true },
      { label: 'Notice of repair request', done: true },
      { label: 'Photographic evidence', done: true },
      { label: 'Certified mail proof of service', done: true },
      { label: 'Inspection report', done: false },
      { label: 'Rent withholding notice', done: false },
    ],
  },
};

export const SEED_DEADLINES = [
  { id: 'd1', day: '28', month: 'May', title: 'Answer to eviction complaint', subtitle: 'Maria Hernandez · LA-2048', tag: 'Tomorrow', tone: 'red' },
  { id: 'd2', day: '30', month: 'May', title: 'Benefits appeal request', subtitle: 'Darius Coleman · LA-2043', tag: '3 days', tone: 'amber' },
  { id: 'd3', day: '02', month: 'Jun', title: 'Evidence submission', subtitle: 'Amina Yusuf · LA-2039', tag: '', tone: '' },
];

export const SEED_REVIEWS = [
  {
    id: 'r1',
    title: 'Eviction response deadline',
    caseId: 'LA-2048',
    who: 'Maria Hernandez',
    priority: 'Critical review',
    submitted: 'May 27',
    date: 'May 28, 2025 at 5:00 PM',
    note: 'Response to the eviction complaint should be filed by this date.',
    evidence: [
      ['Notice to Quit.pdf · Page 2', '“…served upon the tenant on May 10, 2025.”'],
      ['Local court rules · Rule 6.2', '“The tenant must answer within 18 calendar days.”'],
    ],
    conflict: 'Client reports service on May 12. Resolve before approval.',
  },
  {
    id: 'r2',
    title: 'Case chronology',
    caseId: 'LA-2039',
    who: 'Amina Yusuf',
    priority: 'High review',
    submitted: 'May 27',
    date: 'Jun 12, 2025 at 12:00 PM',
    note: 'Chronology should be verified before the immigration filing.',
    evidence: [
      ['Intake form · Page 1', 'Arrival date recorded as March 3.'],
      ['Court notice · Page 2', 'Hearing set for June 10.'],
    ],
    conflict: null,
  },
  {
    id: 'r3',
    title: 'Benefits appeal summary',
    caseId: 'LA-2043',
    who: 'Darius Coleman',
    priority: 'Standard review',
    submitted: 'May 26',
    date: 'Jun 04, 2025 at 5:00 PM',
    note: 'Appeal must be filed within the agency window.',
    evidence: [
      ['Benefits notice · Page 1', 'Appeal must be filed within 60 days.'],
      ['Income statement · Page 2', 'Monthly income listed as $1,180.'],
    ],
    conflict: null,
  },
];

export const SEED_REPORTS = {
  kpis: [
    { label: 'Median time to find evidence', value: '1m 42s', note: 'Down from 6m 10s baseline' },
    { label: 'Claims with a source', value: '97.8%', note: 'Across 1,240 facts' },
    { label: 'Conflicts caught', value: '93.1%', note: 'Before filing deadline' },
    { label: 'Drafts returned', value: '36%', note: 'Down from 48% last quarter' },
  ],
  weeks: [
    { week: 'W1', manual: 62, assisted: 38 },
    { week: 'W2', manual: 58, assisted: 30 },
    { week: 'W3', manual: 55, assisted: 24 },
    { week: 'W4', manual: 50, assisted: 20 },
    { week: 'W5', manual: 48, assisted: 17 },
    { week: 'W6', manual: 46, assisted: 15 },
    { week: 'W7', manual: 44, assisted: 13 },
    { week: 'W8', manual: 42, assisted: 12 },
  ],
  targets: [
    { label: 'Claims with a source', value: 97.8 },
    { label: 'Conflicts caught before filing', value: 93.1 },
    { label: 'Drafts returned for rework', value: 36 },
  ],
};

export const CHECKLIST_TEMPLATES = {
  'Housing · Eviction': [
    'Lease agreement',
    'Notice to Quit',
    'Rent ledger',
    'Client ID',
    'Proof of service',
    'Court complaint',
  ],
  'Housing · Repairs': [
    'Lease agreement',
    'Inspection report',
    'Notice of repair request',
    'Photographic evidence',
    'Certified mail proof of service',
    'Rent withholding notice',
  ],
  'Public Benefits': [
    'Agency notice of action',
    'Income statement',
    'Identification',
    'Appeal request form',
    'Hearing submission',
  ],
  'Immigration': [
    'Passport or ID document',
    'Intake declaration',
    'Notice of hearing',
    'Certified translations',
    'Biometrics appointment receipt',
  ],
  'Family Law': [
    'Petition / Complaint',
    'Financial affidavit',
    'Income documentation',
    'Proof of service',
    'Proposed parenting plan',
  ],
};
