import { createContext, useContext, useState } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

const KEYS = ['cw_token', 'cw_user'];
const clearSession = () => KEYS.forEach((k) => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
const readUser = () => JSON.parse(localStorage.getItem('cw_user') || sessionStorage.getItem('cw_user') || 'null');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);

  // remember = true keeps the session across browser restarts (localStorage); false keeps it for this tab only
  const login = async (email, password, remember = true) => {
    const { token, user } = await api.login({ email, password });
    clearSession();
    const store = remember ? localStorage : sessionStorage;
    store.setItem('cw_token', token);
    store.setItem('cw_user', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
