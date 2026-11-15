import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Overview from './pages/Overview.jsx';
import Cases from './pages/Cases.jsx';
import CaseDetail from './pages/CaseDetail.jsx';
import Review from './pages/Review.jsx';
import Reports from './pages/Reports.jsx';

// Wraps protected pages in the app shell and redirects signed-out users to /login
function Guard({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route path="/overview" element={<Guard><Overview /></Guard>} />
      <Route path="/cases" element={<Guard><Cases /></Guard>} />
      <Route path="/cases/:caseId" element={<Guard><CaseDetail /></Guard>} />
      <Route path="/review" element={<Guard><Review /></Guard>} />
      <Route path="/reports" element={<Guard><Reports /></Guard>} />
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}
