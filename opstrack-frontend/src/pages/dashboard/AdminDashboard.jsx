import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import '../header.css';

function AdminDashboard() {
    const { logout } = useContext(AuthContext);
    return (
        <div className="admin-dashboard" style={{ margin: 0, padding: 0 }}>
            <header className="app-header" style={{ position: 'fixed', top: 0, left: 0 }}>
                <div className="logo-container">
                    <span className="logo-icon">♛</span>
                    <span className="logo-text">
                        <span className="logo-primary">Ops</span>
                        <span className="logo-secondary">Track</span>
                    </span>
                </div>
                <button onClick={logout} className="logout-button-topright" title="Logout">
                    <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>&#x21B5;</span>
                </button>
            </header>
            <div className="header-spacer" />
            <main className="dashboard-content">
                <h1>Admin Dashboard</h1>
            </main>
            <div className="footer-spacer" />
            <footer className="app-footer">
                <p>&copy; {new Date().getFullYear()} OpsTrack. All access monitored.</p>
            </footer>
        </div>
    )
}

export default AdminDashboard;