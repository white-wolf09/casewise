import { store } from '../services/store.js';
import { askEvidence } from '../services/aiService.js';
import {
  assertCase,
  assertCaseId,
  assertFlagId,
  assertChecklistLabel,
  assertUpload,
  assertQuestion,
  ValidationError,
} from '../utils/validation.js';

export async function getCases(req, res, next) {
  try {
    const list = await store.getCases();
    return res.json(list);
  } catch (err) {
    next(err);
  }
}

export async function getCaseById(req, res, next) {
  try {
    const caseId = assertCaseId(req.params.caseId);
    const detail = await store.getCaseById(caseId);
    if (!detail) {
      throw new ValidationError({ caseId: 'Case not found.' });
    }
    return res.json(detail);
  } catch (err) {
    next(err);
  }
}

export async function createCase(req, res, next) {
  try {
    const validated = assertCase(req.body);
    const created = await store.createCase(validated);
    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function resolveFlag(req, res, next) {
  try {
    const caseId = assertCaseId(req.params.caseId);
    const flagId = assertFlagId(req.params.flagId);

    const result = await store.resolveFlag(caseId, flagId);
    if (!result) {
      throw new ValidationError({ flag: 'Flag not found.' });
    }

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function toggleChecklist(req, res, next) {
  try {
    const caseId = assertCaseId(req.params.caseId);
    const label = assertChecklistLabel(req.body?.label);

    const item = await store.toggleChecklist(caseId, label);
    if (!item) {
      throw new ValidationError({ item: 'Checklist item not found.' });
    }

    return res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function uploadDocuments(req, res, next) {
  try {
    const caseId = assertCaseId(req.params.caseId);
    const files = assertUpload(req.body?.files);

    const result = await store.uploadDocuments(caseId, files);
    if (!result) {
      throw new ValidationError({ caseId: 'Case not found.' });
    }

    return res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function askEvidenceController(req, res, next) {
  try {
    const caseId = assertCaseId(req.params.caseId);
    const question = assertQuestion(req.body?.question);

    const caseDetail = await store.getCaseById(caseId);
    if (!caseDetail) {
      throw new ValidationError({ caseId: 'Case not found.' });
    }

    const aiResponse = await askEvidence({ caseDetail, question });
    return res.json(aiResponse);
  } catch (err) {
    next(err);
  }
}
