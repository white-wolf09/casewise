import { Router } from 'express';
import {
  getCases,
  getCaseById,
  createCase,
  resolveFlag,
  toggleChecklist,
  uploadDocuments,
  askEvidenceController,
} from '../controllers/caseController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getCases);
router.post('/', createCase);
router.get('/:caseId', getCaseById);
router.post('/:caseId/flags/:flagId/resolve', resolveFlag);
router.post('/:caseId/checklist/toggle', toggleChecklist);
router.post('/:caseId/documents', uploadDocuments);
router.post('/:caseId/ask', askEvidenceController);

export default router;
