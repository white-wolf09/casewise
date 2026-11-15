import {
  DEMO_USERS,
  SEED_CASES,
  SEED_DETAIL,
  SEED_DEADLINES,
  SEED_REVIEWS,
  SEED_REPORTS,
  CHECKLIST_TEMPLATES,
} from '../data/seedData.js';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Case from '../models/Case.js';
import Review from '../models/Review.js';
import Deadline from '../models/Deadline.js';
import { analyzeUploadedDocuments, generateCaseIntakeAI } from './aiService.js';
import { extractDocumentText } from '../utils/documentExtractor.js';

const PALETTE = ['red', 'blue', 'lilac', 'green', 'peach'];
const RETURNED_TO_ME = 2;

const today = () =>
  new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// In-memory state as fallback and fast-path cache
let memUsers = structuredClone(DEMO_USERS);
let memCases = structuredClone(SEED_CASES);
let memDetail = structuredClone(SEED_DETAIL);
let memDeadlines = structuredClone(SEED_DEADLINES);
let memReviews = structuredClone(SEED_REVIEWS);
let memReports = structuredClone(SEED_REPORTS);
let createdCount = 0;

let dbInitialized = false;

function view(c) {
  const detail = memDetail[c.caseId];
  return {
    ...c,
    openFlags: detail ? detail.flags.length : c.openFlags,
  };
}

export async function initStore() {
  const db = await connectDB();
  if (!db || dbInitialized) return;

  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.insertMany(DEMO_USERS);
    }

    const caseCount = await Case.countDocuments();
    if (caseCount === 0) {
      const caseDocs = SEED_CASES.map((c) => {
        const det = SEED_DETAIL[c.caseId];
        return {
          ...c,
          meta: det?.meta || { supervisor: 'Sarah Patel', nextDeadline: c.deadline, opened: today() },
          flags: det?.flags || [],
          facts: det?.facts || [],
          documents: det?.documents || [],
          timeline: det?.timeline || [],
          checklist: det?.checklist || [],
        };
      });
      await Case.insertMany(caseDocs);
    }

    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0) {
      await Review.insertMany(SEED_REVIEWS);
    }

    const deadlineCount = await Deadline.countDocuments();
    if (deadlineCount === 0) {
      await Deadline.insertMany(SEED_DEADLINES);
    }

    dbInitialized = true;
  } catch (err) {
    console.warn('MongoDB seed init skipped:', err.message);
  }
}

export const store = {
  async findUserByEmail(email) {
    const db = await connectDB();
    if (db) {
      try {
        const found = await User.findOne({ email: email.toLowerCase() }).lean();
        if (found) return found;
      } catch (e) {}
    }
    return memUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async getDashboard() {
    const flags = Object.values(memDetail).flatMap((d) => d.flags || []);
    const totalFlags = memCases.reduce((n, c) => n + view(c).openFlags, 0);
    const critical = flags.filter((f) => f.kind === 'crit').length;

    return {
      stats: {
        activeCases: memCases.length,
        activeAdded: createdCount,
        deadlinesWeek: memDeadlines.length,
        dueIn48h: memDeadlines.filter((d) => d.tag === 'Tomorrow').length,
        openFlags: totalFlags,
        critical,
        important: Math.max(0, totalFlags - critical),
        pendingReview: memReviews.length,
        returned: RETURNED_TO_ME,
      },
      deadlines: memDeadlines,
      cases: memCases.slice(0, 4).map(view),
    };
  },

  async getCases() {
    return memCases.map(view);
  },

  async getCaseById(caseId) {
    const base = memCases.find((x) => x.caseId === caseId);
    if (!base) return null;

    if (!memDetail[caseId] || !memDetail[caseId].flags || memDetail[caseId].flags.length === 0) {
      if (!memDetail[caseId]) {
        // Auto-generate AI case assessment if detail is missing
        const parts = base.clientName.split(' ');
        const aiAssessment = await generateCaseIntakeAI({
          clientFirst: parts[0] || 'Client',
          clientLast: parts.slice(1).join(' ') || 'Case',
          type: base.type,
          language: 'English',
          assignee: base.assignee,
        });

        memDetail[caseId] = {
          meta: {
            supervisor: aiAssessment.supervisor,
            nextDeadline: aiAssessment.nextDeadline,
            opened: today(),
          },
          flags: aiAssessment.flags,
          facts: aiAssessment.facts,
          documents: [],
          timeline: aiAssessment.timeline,
          checklist: aiAssessment.checklist,
        };
      }
    }

    const detail = memDetail[caseId];
    return {
      ...view(base),
      ...structuredClone(detail),
    };
  },

  async createCase(input) {
    const num = Math.max(2100, ...memCases.map((c) => Number(c.caseId.slice(3)) || 0)) + 1;
    const n = memCases.length;
    const caseId = `LA-${num}`;
    const clientName = `${input.clientFirst} ${input.clientLast}`.trim();

    // Call Groq AI to generate full case structure (supervisor, timeline, flags, facts/suggestions, checklist)
    const aiAssessment = await generateCaseIntakeAI({
      clientFirst: input.clientFirst,
      clientLast: input.clientLast,
      type: input.type,
      language: input.language,
      assignee: input.assignee,
    });

    const deadlineShort = (aiAssessment.nextDeadline || 'Jun 14').split(' · ')[0];

    const created = {
      caseId,
      clientName,
      ini: (input.clientFirst[0] + input.clientLast[0]).toUpperCase(),
      tone: PALETTE[n % PALETTE.length],
      type: input.type,
      assignee: input.assignee,
      deadline: deadlineShort,
      health: aiAssessment.health || 80,
      openFlags: aiAssessment.flags.length,
      status: aiAssessment.status || 'Active',
    };

    const detail = {
      meta: {
        supervisor: aiAssessment.supervisor || 'Sarah Patel, Supervising Attorney',
        nextDeadline: aiAssessment.nextDeadline || 'Jun 14 · Response Due',
        opened: today(),
      },
      flags: aiAssessment.flags,
      facts: aiAssessment.facts,
      documents: [],
      timeline: aiAssessment.timeline,
      checklist: aiAssessment.checklist,
    };

    memCases = [created, ...memCases];
    memDetail[caseId] = detail;
    createdCount += 1;

    // Async persist to MongoDB if available
    const db = await connectDB();
    if (db) {
      Case.create({ ...created, ...detail }).catch((e) => console.warn('Mongo insert error:', e.message));
    }

    return created;
  },

  async resolveFlag(caseId, flagId) {
    const detail = memDetail[caseId];
    if (!detail) return null;

    const flag = detail.flags.find((f) => f.id === flagId);
    if (!flag) return null;

    detail.flags = detail.flags.filter((f) => f.id !== flagId);

    // Resolving a critical conflict also clears it from the review queue
    if (flag.kind === 'crit') {
      memReviews.forEach((r) => {
        if (r.caseId === caseId) r.conflict = null;
      });
    }

    detail.timeline = [
      { date: today(), text: `Flag resolved: ${flag.title}` },
      ...detail.timeline,
    ];

    // Recompute health
    const c = memCases.find((x) => x.caseId === caseId);
    if (c) {
      c.openFlags = detail.flags.length;
      const missingChecklist = detail.checklist.filter((x) => !x.done).length;
      c.health = Math.max(40, Math.min(100, 100 - detail.flags.length * 15 - missingChecklist * 4));
    }

    return { ok: true };
  },

  async toggleChecklist(caseId, label) {
    const detail = memDetail[caseId];
    if (!detail) return null;

    const item = detail.checklist.find((x) => x.label === label);
    if (!item) return null;

    item.done = !item.done;

    // Recompute health
    const c = memCases.find((x) => x.caseId === caseId);
    if (c) {
      const missingChecklist = detail.checklist.filter((x) => !x.done).length;
      c.health = Math.max(40, Math.min(100, 100 - detail.flags.length * 15 - missingChecklist * 4));
    }

    return item;
  },

  async uploadDocuments(caseId, files) {
    const base = memCases.find((x) => x.caseId === caseId);
    if (!base) return null;
    if (!memDetail[caseId]) {
      const aiAssessment = await generateCaseIntakeAI({
        clientFirst: base.clientName.split(' ')[0],
        clientLast: base.clientName.split(' ')[1] || '',
        type: base.type,
        language: 'English',
        assignee: base.assignee,
      });
      memDetail[caseId] = {
        meta: { supervisor: aiAssessment.supervisor, nextDeadline: aiAssessment.nextDeadline, opened: today() },
        flags: aiAssessment.flags,
        facts: aiAssessment.facts,
        documents: [],
        timeline: aiAssessment.timeline,
        checklist: aiAssessment.checklist,
      };
    }
    const detail = memDetail[caseId];

    const fmt = (b) =>
      b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

    const uploadedDocs = await Promise.all(
      files.map(async (d) => {
        const ext = d.name.includes('.') ? d.name.split('.').pop().toUpperCase() : 'DOC';
        const text = await extractDocumentText(d);
        if (text) {
          console.log(`[Document Extractor] Successfully extracted ${text.length} characters from ${d.name}`);
        }
        return {
          name: d.name,
          meta: `${ext} · ${fmt(d.size)}`,
          date: today(),
          content: text || '',
        };
      })
    );

    uploadedDocs.forEach((d) => detail.documents.unshift(d));
    detail.timeline = [
      { date: today(), text: `Uploaded ${uploadedDocs.length} file(s)` },
      ...detail.timeline,
    ];

    // Trigger AI document analysis and extraction via Groq
    try {
      const aiResult = await analyzeUploadedDocuments({
        caseDetail: { ...base, ...detail },
        uploadedDocs,
      });

      if (aiResult.extractedFacts && aiResult.extractedFacts.length > 0) {
        aiResult.extractedFacts.forEach((f) => {
          if (!detail.facts.some((ef) => ef.label === f.label)) {
            detail.facts.push(f);
          }
        });
      }

      if (aiResult.updatedChecklist) {
        detail.checklist = aiResult.updatedChecklist;
      }

      if (aiResult.newFlags && aiResult.newFlags.length > 0) {
        aiResult.newFlags.forEach((fl) => {
          if (!detail.flags.some((ef) => ef.title === fl.title)) {
            detail.flags.push(fl);
          }
        });
      }
    } catch (err) {
      console.warn('AI upload analysis skipped:', err.message);
    }

    // Recompute health
    const missingChecklist = detail.checklist.filter((x) => !x.done).length;
    base.health = Math.max(40, Math.min(100, 100 - detail.flags.length * 15 - missingChecklist * 4));
    base.openFlags = detail.flags.length;

    return { added: uploadedDocs.length };
  },

  async getReviews() {
    return memReviews.map(({ id, title, caseId, who, priority, submitted }) => ({
      id,
      title,
      caseId,
      who,
      priority,
      submitted,
    }));
  },

  async getReviewById(id) {
    const item = memReviews.find((r) => r.id === id);
    return item ? structuredClone(item) : null;
  },

  async decideReview(id, decision, note) {
    const item = memReviews.find((r) => r.id === id);
    if (!item) return { notFound: true };

    if (decision === 'approve' && item.conflict) {
      return { conflictError: 'Resolve the open conflict before approving.' };
    }

    memReviews = memReviews.filter((r) => r.id !== id);
    return { ok: true, decision };
  },

  async getReports() {
    return memReports;
  },

  async search(q) {
    const term = (q || '').trim().toLowerCase();
    if (!term) return [];
    return memCases
      .filter((c) => `${c.clientName} ${c.caseId} ${c.type}`.toLowerCase().includes(term))
      .slice(0, 6)
      .map(view);
  },

  async getNotifications() {
    return {
      reviews: memReviews.length,
      deadlines: memDeadlines.slice(0, 3),
    };
  },
};

export default store;
