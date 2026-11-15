import { store } from '../services/store.js';

export async function getNotifications(req, res, next) {
  try {
    const data = await store.getNotifications();
    return res.json(data);
  } catch (err) {
    next(err);
  }
}
