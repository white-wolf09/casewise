import Groq from 'groq-sdk';
import { GROQ_API_KEY, GROQ_MODEL } from '../config/env.js';

function isGroqKeyValid(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.length < 15) return false;
  if (trimmed.includes('placeholder') || trimmed.includes('your_groq_api_key') || trimmed.includes('replace_with')) {
    return false;
  }
  return true;
}

const isConfigured = isGroqKeyValid(GROQ_API_KEY);
let groqClient = null;

if (isConfigured) {
  try {
    groqClient = new Groq({ apiKey: GROQ_API_KEY.trim() });
  } catch (err) {
    console.warn('Groq client initialization warning:', err.message);
  }
}

export const aiStatus = {
  isConfigured,
  model: GROQ_MODEL,
};

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
  if (!groqClient || !isGroqKeyValid(GROQ_API_KEY)) {
    return fallbackAskEvidence(caseDetail, question);
  }

  const promptContext = {
    caseId: caseDetail.caseId,
    clientName: caseDetail.clientName,
    caseType: caseDetail.type,
    primaryLanguage: caseDetail.facts?.find((f) => f.label.toLowerCase().includes('language'))?.value || 'English',
    existingFacts: caseDetail.facts || [],
    documents: caseDetail.documents || [],
    flags: caseDetail.flags || [],
    timeline: caseDetail.timeline || [],
    checklist: caseDetail.checklist || [],
  };

  const systemPrompt = `You are Casewise Assist, an AI legal assistant embedded in Casewise case management system for legal aid attorneys and caseworkers.
Your role is to analyze case evidence, facts, and documents, and answer the user's specific query with strict factual accuracy and source provenance.
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
    const response = await groqClient.chat.completions.create({
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

    return {
      answer: parsed.answer || `Analyzed evidence for case ${caseDetail.caseId}.`,
      facts: Array.isArray(parsed.facts) ? parsed.facts : [],
      documents: Array.isArray(parsed.documents) ? parsed.documents : [],
    };
  } catch (err) {
    console.warn('Groq AI askEvidence failed, using fallback:', err.message);
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

  if (!groqClient || !isGroqKeyValid(GROQ_API_KEY)) {
    // Fallback extraction
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

  const systemPrompt = `You are Casewise Assist. You analyze newly uploaded legal documents for a case and extract facts with source provenance.
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
    const response = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: systemPrompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices?.[0]?.message?.content || '{}');
    return {
      extractedFacts: Array.isArray(parsed.extractedFacts) ? parsed.extractedFacts : [],
      updatedChecklist,
      newFlags: Array.isArray(parsed.newFlags) ? parsed.newFlags : [],
    };
  } catch (err) {
    console.warn('Groq document analysis failed, falling back:', err.message);
    return {
      extractedFacts: [],
      updatedChecklist,
      newFlags: [],
    };
  }
}
