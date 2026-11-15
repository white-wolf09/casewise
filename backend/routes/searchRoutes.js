import { Router } from 'express';
import { search } from '../controllers/searchController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', search);

export default router;
