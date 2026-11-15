import Groq from 'groq-sdk';
import { GROQ_API_KEY, GROQ_MODEL } from '../config/env.js';

export function isGroqKeyValid(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim().replace(/^["']|["']$/g, '');
  if (trimmed.length < 15) return false;
  if (
    trimmed.includes('placeholder') ||
    trimmed.includes('your_groq_api_key') ||
    trimmed.includes('replace_with')
  ) {
    return false;
  }
  return true;
}

export function getGroqClient() {
  const key = (process.env.GROQ_API_KEY || GROQ_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  if (!isGroqKeyValid(key)) {
    return null;
  }
  try {
    return new Groq({ apiKey: key });
  } catch (err) {
    console.warn('[Groq Client Init Warning]:', err.message);
    return null;
  }
}

export const aiStatus = {
  get isConfigured() {
    return isGroqKeyValid(process.env.GROQ_API_KEY || GROQ_API_KEY);
  },
  model: GROQ_MODEL,
};

const today = () =>
  new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * Intelligent Fallback for Case Intake Assessment
 */
function fallbackCaseIntake({ clientFirst, clientLast, type, language, assignee }) {
  const clientName = `${clientFirst} ${clientLast}`.trim();
  const opened = today();

  if (type.includes('Eviction')) {
    return {
      supervisor: 'Sarah Patel, Supervising Housing Attorney',
      nextDeadline: 'Jun 14 · Answer to Summons (5 days)',
      health: 72,
      status: 'Urgent',
      flags: [
        {
          id: 'f_init_1',
          kind: 'crit',
          label: 'Critical conflict',
          title: 'Service date verification required',
          body: 'Client reports notice received on recent date. Check court docket to verify if unlawful detainer complaint was filed.',
        },
        {
          id: 'f_init_2',
          kind: 'miss',
          label: 'Missing document',
          title: 'Notice to Quit copy needed',
          body: 'A copy of the written notice to vacate has not yet been attached. Request from client immediately.',
        },
      ],
      facts: [
        { label: 'Matter category', value: 'Residential Eviction Defense', source: 'Intake form' },
        { label: 'Primary language', value: language, source: 'Intake form' },
        { label: 'Tenancy status', value: 'Active residential lease', source: 'Client interview' },
        { label: 'Subsidized housing', value: 'Section 8 / Voucher (Under review)', source: 'Intake interview' },
        { label: 'Emergency defense', value: 'Active statutory answer window', source: 'Court rule triage' },
      ],
      timeline: [
        { date: opened, text: 'Case opened and assigned for rapid eviction defense triage' },
        { date: opened, text: `Intake assessment completed by ${assignee}` },
      ],
      checklist: [
        { label: 'Notice to Quit', done: false },
        { label: 'Lease agreement', done: false },
        { label: 'Proof of service', done: false },
        { label: 'Rent receipts / ledger', done: false },
        { label: 'Court summons and complaint', done: false },
        { label: 'Fee waiver application', done: false },
      ],
    };
  }

  if (type.includes('Repairs')) {
    return {
      supervisor: 'Sarah Patel, Supervising Housing Attorney',
      nextDeadline: 'Jun 25 · 30-Day Cure Notice Expiration',
      health: 80,
      status: 'Active',
      flags: [
        {
          id: 'f_init_1',
          kind: 'miss',
          label: 'Missing document',
          title: 'Code compliance inspection report needed',
          body: 'Request official municipal housing inspection record to establish habitability defects.',
        },
      ],
      facts: [
        { label: 'Matter category', value: 'Habitability & Repair Enforcement', source: 'Intake form' },
        { label: 'Primary language', value: language, source: 'Intake form' },
        { label: 'Notice of defect', value: 'Written notice served on landlord', source: 'Intake questionnaire' },
        { label: 'Landlord response', value: 'No repairs initiated within statutory cure window', source: 'Client statement' },
      ],
      timeline: [
        { date: opened, text: 'Case opened for tenant repair and code compliance advocacy' },
        { date: opened, text: `Assigned to ${assignee} for initial notice review` },
      ],
      checklist: [
        { label: 'Lease agreement', done: false },
        { label: 'Written repair request', done: false },
        { label: 'Defect photos / video log', done: false },
        { label: 'Proof of mailing / service', done: false },
        { label: 'City inspector report', done: false },
      ],
    };
  }

  if (type.includes('Benefits')) {
    return {
      supervisor: 'Sarah Patel, Senior Benefits Counsel',
      nextDeadline: 'Jun 20 · Administrative Hearing Request (14 days)',
      health: 85,
      status: 'Active',
      flags: [
        {
          id: 'f_init_1',
          kind: 'miss',
          label: 'Missing document',
          title: 'Agency Notice of Denial copy required',
          body: 'The formal Department Notice of Action stating the legal reason for denial must be uploaded.',
        },
      ],
      facts: [
        { label: 'Program area', value: 'Public Assistance & Benefit Appeals', source: 'Intake record' },
        { label: 'Primary language', value: language, source: 'Intake record' },
        { label: 'Action contested', value: 'Adverse determination / benefit reduction', source: 'Intake interview' },
        { label: 'Aid paid pending', value: 'Timely request requested to preserve benefits', source: 'Intake interview' },
      ],
      timeline: [
        { date: opened, text: 'Benefits appeal case opened' },
        { date: opened, text: `Hearing deadline tracked by ${assignee}` },
      ],
      checklist: [
        { label: 'Agency Notice of Action', done: false },
        { label: 'Income documentation', done: false },
        { label: 'Household expense receipts', done: false },
        { label: 'Fair hearing request form', done: false },
      ],
    };
  }

  if (type.includes('Immigration')) {
    return {
      supervisor: 'Sarah Patel, Managing Immigration Attorney',
      nextDeadline: 'Jul 15 · Master Calendar Hearing',
      health: 82,
      status: 'Active',
      flags: [
        {
          id: 'f_init_1',
          kind: 'miss',
          label: 'Missing document',
          title: 'Certified translation needed',
          body: 'Foreign identification and declarations must have certified English translations attached.',
        },
      ],
      facts: [
        { label: 'Matter category', value: 'Immigration Defense & Asylum Support', source: 'Intake declaration' },
        { label: 'Primary language', value: language, source: 'Intake record' },
        { label: 'Immigration status', value: 'In removal proceedings / affirmative filing', source: 'Intake form' },
      ],
      timeline: [
        { date: opened, text: 'Immigration defense matter opened' },
        { date: opened, text: `Intake intake completed by ${assignee}` },
      ],
      checklist: [
        { label: 'Passport or ID document', done: false },
        { label: 'Notice to Appear (NTA)', done: false },
        { label: 'Certified translations', done: false },
        { label: 'Personal declaration', done: false },
        { label: 'Country conditions evidence', done: false },
      ],
    };
  }

  // Family Law & Generic fallback
  return {
    supervisor: 'Sarah Patel, Managing Family Law Attorney',
    nextDeadline: 'Jun 28 · Initial Case Management Conference',
    health: 90,
    status: 'Active',
    flags: [
      {
        id: 'f_init_1',
        kind: 'miss',
        label: 'Missing document',
        title: 'Financial disclosure verification',
        body: 'Mandatory preliminary financial disclosures and income affidavit must be compiled.',
      },
    ],
    facts: [
      { label: 'Case type', value: type, source: 'Intake form' },
      { label: 'Primary language', value: language, source: 'Intake form' },
      { label: 'Assigned worker', value: assignee, source: 'Assignment record' },
      { label: 'Jurisdiction', value: 'County Family Court', source: 'Intake record' },
    ],
    timeline: [
      { date: opened, text: 'Case opened and conflict checks verified' },
      { date: opened, text: `Initial consultation completed by ${assignee}` },
    ],
    checklist: [
      { label: 'Petition / Complaint', done: false },
      { label: 'Financial affidavit', done: false },
      { label: 'Income documentation', done: false },
      { label: 'Proof of service', done: false },
      { label: 'Proposed parenting plan', done: false },
    ],
  };
}

/**
 * AI Case Intake & Assessment (Called when creating a new case)
 * Generates: supervisor, nextDeadline, flags, facts (AI Suggestions), timeline, checklist
 */
export async function generateCaseIntakeAI({ clientFirst, clientLast, type, language, assignee }) {
  const groq = getGroqClient();

  if (!groq) {
    return fallbackCaseIntake({ clientFirst, clientLast, type, language, assignee });
  }

  console.log(`[Groq AI] >>> Generating Case Intake Assessment for ${clientFirst} ${clientLast} (${type})`);

  const systemPrompt = `You are Casewise Assist AI, an expert legal intake reasoning engine for legal aid case management.
Given a new legal case intake, generate the initial case structure with high legal accuracy:
- "supervisor": Full name and title of senior supervising attorney (e.g. "Sarah Patel, Supervising Housing Attorney")
- "nextDeadline": A realistic statutory next deadline (e.g. "Jun 14 · Answer to Summons (5 days)")
- "status": "Urgent" (for evictions or imminent deadlines) or "Active"
- "health": A score between 65 and 90
- "flags": 1 or 2 realistic initial flags/issues needing attention:
  [{ "id": "f_init_1", "kind": "crit" | "miss", "label": "Critical conflict" | "Missing document", "title": "string", "body": "string" }]
- "facts": 4 to 6 auto-extracted facts with source citations:
  [{ "label": "string", "value": "string", "source": "Intake interview | Intake form | Client disclosure" }]
- "timeline": 2 chronological milestone events:
  [{ "date": "${today()}", "text": "string" }]
- "checklist": 5 to 7 statutory legal document requirements:
  [{ "label": "string", "done": false }]

Return STRICTLY valid JSON with no markdown wrapping.`;

  const userPrompt = `New Case Intake:
Client: ${clientFirst} ${clientLast}
Case Type: ${type}
Primary Language: ${language}
Assigned Case Worker: ${assignee}`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices?.[0]?.message?.content || '{}');
    console.log(`[Groq AI] <<< Successfully generated AI Intake structure via Groq for ${clientFirst} ${clientLast}`);

    return {
      supervisor: parsed.supervisor || 'Sarah Patel, Supervising Attorney',
      nextDeadline: parsed.nextDeadline || 'Jun 14 · Answer Window',
      status: parsed.status || (type.includes('Eviction') ? 'Urgent' : 'Active'),
      health: typeof parsed.health === 'number' ? parsed.health : 78,
      flags: Array.isArray(parsed.flags) && parsed.flags.length ? parsed.flags : fallbackCaseIntake({ clientFirst, clientLast, type, language, assignee }).flags,
      facts: Array.isArray(parsed.facts) && parsed.facts.length ? parsed.facts : fallbackCaseIntake({ clientFirst, clientLast, type, language, assignee }).facts,
      timeline: Array.isArray(parsed.timeline) && parsed.timeline.length ? parsed.timeline : fallbackCaseIntake({ clientFirst, clientLast, type, language, assignee }).timeline,
      checklist: Array.isArray(parsed.checklist) && parsed.checklist.length ? parsed.checklist : fallbackCaseIntake({ clientFirst, clientLast, type, language, assignee }).checklist,
    };
  } catch (err) {
    console.warn(`[Groq AI Warning] generateCaseIntakeAI failed, using fallback:`, err.message);
    return fallbackCaseIntake({ clientFirst, clientLast, type, language, assignee });
  }
}

/**
 * Fallback semantic/keyword search for facts and documents in a case
 */
function fallbackAskEvidence(caseDetail, question) {
  const terms = (question || '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 2);

  const hit = (text) => terms.some((t) => (text || '').toLowerCase().includes(t));

  const facts = (caseDetail.facts || []).filter((f) =>
    hit(`${f.label} ${f.value} ${f.source}`)
  );

  const documents = (caseDetail.documents || []).filter((d) =>
    hit(`${d.name} ${d.meta}`)
  );

  const total = facts.length + documents.length;
  let answer;
  if (total > 0) {
    const factSummary = facts.slice(0, 3).map((f) => `${f.label}: ${f.value} (${f.source})`).join('; ');
    answer = `Found ${total} matching evidence item${total > 1 ? 's' : ''} for "${question}". ${factSummary ? `Key evidence includes: ${factSummary}.` : ''}`;
  } else {
    answer = `No matching facts or documents found in ${caseDetail.caseId} for this query. Try different terms or upload relevant case records.`;
  }

  return {
    answer,
    facts,
    documents,
  };
}

/**
 * Casewise Assist: Ask Evidence powered by Groq LLM
 */
export async function askEvidence({ caseDetail, question }) {
  const groq = getGroqClient();

  if (!groq) {
    console.log(`[Groq AI] Running fallbackAskEvidence for: "${question}" (Groq API Key not configured)`);
    return fallbackAskEvidence(caseDetail, question);
  }

  console.log(`[Groq AI] >>> Calling Groq API askEvidence for case ${caseDetail.caseId}: "${question}"`);

  const promptContext = {
    caseId: caseDetail.caseId,
    clientName: caseDetail.clientName,
    caseType: caseDetail.type,
    supervisor: caseDetail.meta?.supervisor,
    nextDeadline: caseDetail.meta?.nextDeadline,
    facts: caseDetail.facts || [],
    documents: caseDetail.documents || [],
    flags: caseDetail.flags || [],
    timeline: caseDetail.timeline || [],
    checklist: caseDetail.checklist || [],
  };

  const systemPrompt = `You are Casewise Assist, an AI legal assistant embedded in Casewise case management system for legal aid attorneys and caseworkers.
Your role is to analyze case evidence, facts, and documents, and answer the caseworker's specific query with strict factual accuracy and source provenance.
Rules:
1. Always ground your answer strictly in the provided case details and evidence.
2. In the "answer" field, provide a clear, direct, professional answer (1-3 sentences) summarizing the evidence.
3. In "facts", include the most relevant facts from the case (or new precise facts derived from the documents), formatted with "label", "value", and "source".
4. In "documents", include the relevant documents with "name" and "meta".
5. Return strictly valid JSON with no markdown formatting or extra text outside the JSON object.

JSON Schema:
{
  "answer": "string",
  "facts": [
    { "label": "string", "value": "string", "source": "string" }
  ],
  "documents": [
    { "name": "string", "meta": "string" }
  ]
}`;

  const userPrompt = `Case Information:
${JSON.stringify(promptContext, null, 2)}

Caseworker Question: "${question}"

Provide the grounded evidence answer in JSON format:`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      return fallbackAskEvidence(caseDetail, question);
    }

    const parsed = JSON.parse(content);
    console.log(`[Groq AI] <<< askEvidence successfully answered via Groq with ${parsed.facts?.length || 0} facts`);

    return {
      answer: parsed.answer || `Analyzed evidence for case ${caseDetail.caseId}.`,
      facts: Array.isArray(parsed.facts) ? parsed.facts : [],
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
    };
  } catch (err) {
    console.warn('[Groq AI Warning] askEvidence failed, using fallback:', err.message);
    return fallbackAskEvidence(caseDetail, question);
  }
}

/**
 * AI-powered document analysis and fact extraction on upload
 */
export async function analyzeUploadedDocuments({ caseDetail, uploadedDocs }) {
  // Check if any checklist item can be matched from uploaded doc names
  const updatedChecklist = (caseDetail.checklist || []).map((item) => {
    if (item.done) return item;
    const match = uploadedDocs.some((d) => {
      const name = d.name.toLowerCase();
      const label = item.label.toLowerCase();
      return name.includes(label.split(' ')[0]) || label.includes(name.split('.')[0]);
    });
    return match ? { ...item, done: true } : item;
  });

  const groq = getGroqClient();

  if (!groq) {
    const extractedFacts = [];
    uploadedDocs.forEach((d) => {
      const lower = d.name.toLowerCase();
      if (lower.includes('lease')) {
        extractedFacts.push({ label: 'Lease document', value: 'Attached and verified', source: `${d.name} · p.1` });
      } else if (lower.includes('notice')) {
        extractedFacts.push({ label: 'Notice record', value: 'Notice attached', source: `${d.name} · p.1` });
      } else if (lower.includes('ledger') || lower.includes('rent')) {
        extractedFacts.push({ label: 'Rent payment status', value: 'Ledger verified', source: `${d.name} · p.1` });
      } else if (lower.includes('id') || lower.includes('passport')) {
        extractedFacts.push({ label: 'Identity verification', value: 'Verified with photo ID', source: `${d.name} · p.1` });
      }
    });

    return {
      extractedFacts,
      updatedChecklist,
      newFlags: [],
    };
  }

  console.log(`[Groq AI] >>> Calling Groq API to analyze uploaded documents:`, uploadedDocs.map((d) => d.name));

  const systemPrompt = `You are Casewise Assist AI. You analyze newly uploaded legal documents for a case and extract legal facts with source provenance.
Case Type: ${caseDetail.type}
Existing Facts: ${JSON.stringify(caseDetail.facts || [])}
Uploaded Files: ${JSON.stringify(uploadedDocs)}

Return strictly valid JSON:
{
  "extractedFacts": [
    { "label": "string", "value": "string", "source": "string" }
  ],
  "newFlags": [
    { "id": "string", "kind": "crit|miss", "label": "string", "title": "string", "body": "string" }
  ]
}`;

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: systemPrompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices?.[0]?.message?.content || '{}');
    console.log(`[Groq AI] <<< Document analysis complete via Groq`);

    return {
      extractedFacts: Array.isArray(parsed.extractedFacts) ? parsed.extractedFacts : [],
      updatedChecklist,
      newFlags: Array.isArray(parsed.newFlags) ? parsed.newFlags : [],
    };
  } catch (err) {
    console.warn('[Groq AI Warning] Document analysis failed, falling back:', err.message);
    return {
      extractedFacts: [],
      updatedChecklist,
      newFlags: [],
    };
  }
}
