import { createContext, useCallback, useContext, useState } from 'react';

// Shared refresh signal and toast notifications.
// Any action calls bump() so every page and the sidebar re-fetch their data.
const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [version, setVersion] = useState(0);
  const [toasts, setToasts] = useState([]);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const toast = useCallback((message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, message }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <DataContext.Provider value={{ version, bump, toast }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className="toast">{t.message}</div>)}
      </div>
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
