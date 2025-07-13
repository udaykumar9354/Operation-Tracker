import { useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Login from './pages/login';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import CommanderDashboard from './pages/dashboard/CommanderDashboard';
import LogisticsDashboard from './pages/dashboard/LogisticsDashboard';
import ConvoyList from './pages/dashboard/ConvoyList';
import UserList from './pages/dashboard/UserList';
import VehicleList from './pages/dashboard/VehicleList';


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
  const location = typeof window !== 'undefined' ? window.location : { pathname: '/' };

  // Option 4: In dev, always redirect to login if not logged in
  if (import.meta.env.DEV && !user && location.pathname !== '/') {
    window.location.replace('/');
    return null;
  }

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
        {/* Route for viewing all convoys */}
        <Route
          path="/convoys"
          element={
            user ? <ConvoyList /> : <Navigate to="/" />
          }
        />
        {/* Route for viewing all users */}
        <Route
          path="/users"
          element={
            user ? <UserList /> : <Navigate to="/" />
          }
        />
        {/* Route for viewing all vehicles */}
        <Route
          path="/vehicles"
          element={
            user ? <VehicleList /> : <Navigate to="/" />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
