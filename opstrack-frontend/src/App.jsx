import { useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/login';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import CommanderDashboard from './pages/dashboard/CommanderDashboard';
import LogisticsDashboard from './pages/dashboard/LogisticsDashboard';

function DashboardRoutes({ role }) {
  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'commander':
      return <CommanderDashboard />;
    case 'logistics':
      return <LogisticsDashboard />;
    default:
      return <div>Unauthorized</div>;
  }
}

function App() {
  const { user, login } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            !user ? <Login onLogin={login} /> : <Navigate to="/dashboard" />
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? <DashboardRoutes role={user.role} /> : <Navigate to="/" />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
