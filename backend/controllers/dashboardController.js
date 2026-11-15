import { store } from '../services/store.js';

export async function getDashboard(req, res, next) {
  try {
    const data = await store.getDashboard();
    return res.json(data);
  } catch (err) {
    next(err);
  }
}
