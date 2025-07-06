import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import '../login.module.css';

const API_BASE = "http://localhost:8080/api";

function AdminDashboard() {
    const { logout } = useContext(AuthContext);
    const [stats, setStats] = useState({
        totalConvoys: '--',
        activeConvoys: '--',
        totalVehicles: '--',
        totalUsers: '--',
        activeMaintenanceLogs: '--',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                const [convoysRes, activeConvoysRes, vehiclesRes, usersRes, logsRes] = await Promise.all([
                    fetch(`${API_BASE}/convoys/all-convoys`, { headers }),
                    fetch(`${API_BASE}/convoys/active`, { headers }),
                    fetch(`${API_BASE}/vehicles/all-vehicles`, { headers }),
                    fetch(`${API_BASE}/users/all-users`, { headers }),
                    fetch(`${API_BASE}/logs/all-logs`, { headers })
                ]);

                const convoys = await convoysRes.json();
                const activeConvoys = await activeConvoysRes.json();
                const vehicles = await vehiclesRes.json();
                const users = await usersRes.json();
                const logs = await logsRes.json();

                setStats({
                    totalConvoys: Array.isArray(convoys) ? convoys.length : 0,
                    activeConvoys: Array.isArray(activeConvoys) ? activeConvoys.length : 0,
                    totalVehicles: Array.isArray(vehicles) ? vehicles.length : 0,
                    totalUsers: Array.isArray(users) ? users.length : 0,
                    activeMaintenanceLogs: Array.isArray(logs) ? logs.length : 0,
                });
            } catch (err) {
                setStats({
                    totalConvoys: '--',
                    activeConvoys: '--',
                    totalVehicles: '--',
                    totalUsers: '--',
                    activeMaintenanceLogs: '--',
                });
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    return (
        <div className="login-page">
            <header className="app-header">
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
            <main style={{ width: '100vw', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', marginTop: '2rem' }}>
                <h1 style={{ color: '#22c55e', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '2.2rem', marginBottom: '2.5rem', letterSpacing: '1px' }}>Admin Dashboard</h1>
                <section style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div style={{ background: '#11251e', borderRadius: '10px', padding: '1.5rem 2.5rem', minWidth: '160px', textAlign: 'center', border: '1px solid #14532d', color: '#d1fae5', marginBottom: '1rem' }}>
                        <h2 style={{ color: '#22c55e', fontSize: '1.1rem', fontWeight: 600, marginBottom: '10px' }}>Total Convoys</h2>
                        <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{loading ? '--' : stats.totalConvoys}</p>
                    </div>
                    <div style={{ background: '#11251e', borderRadius: '10px', padding: '1.5rem 2.5rem', minWidth: '160px', textAlign: 'center', border: '1px solid #14532d', color: '#d1fae5', marginBottom: '1rem' }}>
                        <h2 style={{ color: '#22c55e', fontSize: '1.1rem', fontWeight: 600, marginBottom: '10px' }}>Total Vehicles</h2>
                        <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{loading ? '--' : stats.totalVehicles}</p>
                    </div>
                    <div style={{ background: '#11251e', borderRadius: '10px', padding: '1.5rem 2.5rem', minWidth: '160px', textAlign: 'center', border: '1px solid #14532d', color: '#d1fae5', marginBottom: '1rem' }}>
                        <h2 style={{ color: '#22c55e', fontSize: '1.1rem', fontWeight: 600, marginBottom: '10px' }}>Total Users</h2>
                        <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{loading ? '--' : stats.totalUsers}</p>
                    </div>
                    <div style={{ background: '#11251e', borderRadius: '10px', padding: '1.5rem 2.5rem', minWidth: '160px', textAlign: 'center', border: '1px solid #14532d', color: '#d1fae5', marginBottom: '1rem' }}>
                        <h2 style={{ color: '#22c55e', fontSize: '1.1rem', fontWeight: 600, marginBottom: '10px' }}>Active Convoys</h2>
                        <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{loading ? '--' : stats.activeConvoys}</p>
                    </div>
                    <div style={{ background: '#11251e', borderRadius: '10px', padding: '1.5rem 2.5rem', minWidth: '160px', textAlign: 'center', border: '1px solid #14532d', color: '#d1fae5', marginBottom: '1rem' }}>
                        <h2 style={{ color: '#22c55e', fontSize: '1.1rem', fontWeight: 600, marginBottom: '10px' }}>Active Maintenance Logs</h2>
                        <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{loading ? '--' : stats.activeMaintenanceLogs}</p>
                    </div>
                </section>
                <section style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                    <div style={{ background: '#11251e', borderRadius: '10px', padding: '1.5rem 2.5rem', minWidth: '220px', border: '1px solid #14532d', color: '#d1fae5', marginBottom: '1rem' }}>
                        <h3 style={{ color: '#22c55e', fontSize: '1.15rem', fontWeight: 600, marginBottom: '18px' }}>Convoy Management</h3>
                        <button style={{ background: '#166534', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 18px', fontSize: '1rem', fontWeight: 600, marginBottom: '10px', marginRight: '8px', cursor: 'pointer', width: '100%' }}>View Convoys</button>
                        <button style={{ background: '#166534', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 18px', fontSize: '1rem', fontWeight: 600, marginBottom: '10px', marginRight: '8px', cursor: 'pointer', width: '100%' }}>Add Convoy</button>
                    </div>
                    <div style={{ background: '#11251e', borderRadius: '10px', padding: '1.5rem 2.5rem', minWidth: '220px', border: '1px solid #14532d', color: '#d1fae5', marginBottom: '1rem' }}>
                        <h3 style={{ color: '#22c55e', fontSize: '1.15rem', fontWeight: 600, marginBottom: '18px' }}>Vehicle Management</h3>
                        <button style={{ background: '#166534', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 18px', fontSize: '1rem', fontWeight: 600, marginBottom: '10px', marginRight: '8px', cursor: 'pointer', width: '100%' }}>View Vehicles</button>
                        <button style={{ background: '#166534', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 18px', fontSize: '1rem', fontWeight: 600, marginBottom: '10px', marginRight: '8px', cursor: 'pointer', width: '100%' }}>Add Vehicle</button>
                    </div>
                    <div style={{ background: '#11251e', borderRadius: '10px', padding: '1.5rem 2.5rem', minWidth: '220px', border: '1px solid #14532d', color: '#d1fae5', marginBottom: '1rem' }}>
                        <h3 style={{ color: '#22c55e', fontSize: '1.15rem', fontWeight: 600, marginBottom: '18px' }}>User Management</h3>
                        <button style={{ background: '#166534', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 18px', fontSize: '1rem', fontWeight: 600, marginBottom: '10px', marginRight: '8px', cursor: 'pointer', width: '100%' }}>View Users</button>
                        <button style={{ background: '#166534', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 18px', fontSize: '1rem', fontWeight: 600, marginBottom: '10px', marginRight: '8px', cursor: 'pointer', width: '100%' }}>Add User</button>
                    </div>
                    <div style={{ background: '#11251e', borderRadius: '10px', padding: '1.5rem 2.5rem', minWidth: '220px', border: '1px solid #14532d', color: '#d1fae5', marginBottom: '1rem' }}>
                        <h3 style={{ color: '#22c55e', fontSize: '1.15rem', fontWeight: 600, marginBottom: '18px' }}>Recent Activity</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#d1fae5', fontSize: '0.98rem' }}>
                            <li>No recent activity.</li>
                        </ul>
                    </div>
                </section>
            </main>
            <div className="footer-spacer" />
            <footer className="app-footer">
                <p>&copy; {new Date().getFullYear()} OpsTrack. All access monitored.</p>
            </footer>
        </div>
    )
}

export default AdminDashboard;