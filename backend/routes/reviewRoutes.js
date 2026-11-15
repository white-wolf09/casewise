import { Router } from 'express';
import { getReviews, getReviewById, decideReview } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getReviews);
router.get('/:id', getReviewById);
router.post('/:id/decision', decideReview);

export default router;
