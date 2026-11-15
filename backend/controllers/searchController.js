import { store } from '../services/store.js';
import { assertSearch } from '../utils/validation.js';

export async function search(req, res, next) {
  try {
    const q = assertSearch(req.query.q || '');
    const results = await store.search(q);
    return res.json(results);
  } catch (err) {
    next(err);
  }
}
