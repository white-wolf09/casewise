import { store } from '../services/store.js';

export async function getReports(req, res, next) {
  try {
    const data = await store.getReports();
    return res.json(data);
  } catch (err) {
    next(err);
  }
}
