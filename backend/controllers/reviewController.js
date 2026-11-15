import { store } from '../services/store.js';
import { assertReviewId, assertDecision, ValidationError } from '../utils/validation.js';

export async function getReviews(req, res, next) {
  try {
    const list = await store.getReviews();
    return res.json(list);
  } catch (err) {
    next(err);
  }
}

export async function getReviewById(req, res, next) {
  try {
    const id = assertReviewId(req.params.id);
    const item = await store.getReviewById(id);
    if (!item) {
      throw new ValidationError({ id: 'Review not found.' });
    }
    return res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function decideReview(req, res, next) {
  try {
    const id = assertReviewId(req.params.id);
    const { decision, note } = assertDecision(req.body);

    const result = await store.decideReview(id, decision, note);
    if (result.notFound) {
      throw new ValidationError({ id: 'Review not found.' });
    }

    if (result.conflictError) {
      throw new ValidationError({ decision: result.conflictError });
    }

    return res.json({ ok: true, decision });
  } catch (err) {
    next(err);
  }
}
