import jwt from 'jsonwebtoken';
import { store } from '../services/store.js';
import { assertLogin, ValidationError } from '../utils/validation.js';
import { JWT_SECRET } from '../config/env.js';

export async function login(req, res, next) {
  try {
    const { email, password } = assertLogin(req.body);
    const user = await store.findUserByEmail(email);

    if (!user || user.password !== password) {
      throw new ValidationError({ form: 'Incorrect email or password.' });
    }

    const payload = {
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}
