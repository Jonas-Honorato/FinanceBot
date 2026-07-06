import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { Login } from './pages/Login.jsx';
import { Overview } from './pages/Overview.jsx';
import { Transactions } from './pages/Transactions.jsx';
import { Budgets } from './pages/Budgets.jsx';
import { Goals } from './pages/Goals.jsx';
import { Reports } from './pages/Reports.jsx';
import { getToken } from './services/api.js';

function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Overview />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="goals" element={<Goals />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}
