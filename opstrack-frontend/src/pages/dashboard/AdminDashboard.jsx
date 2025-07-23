import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import '../login.module.css';
import { useNavigate } from 'react-router-dom';

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

    // State for showing the Add Convoy modal
    const [showAddConvoy, setShowAddConvoy] = useState(false);
    // State for the Add Convoy form fields
    const [convoyForm, setConvoyForm] = useState({
        name: "",
        status: "active",
        route: [
            { latitude: "", longitude: "" }, // Start point
            { latitude: "", longitude: "" }, // End point
        ],
        commander: "", // Commander user ID
    });
    // State for form submission/loading
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    // State for available commanders
    const [commanders, setCommanders] = useState([]);

    // State for Add User modal
    const [showAddUser, setShowAddUser] = useState(false);
    const [userForm, setUserForm] = useState({ name: '', username: '', email: '', rank: '', role: 'commander', password: '' });
    const [userFormLoading, setUserFormLoading] = useState(false);
    const [userFormError, setUserFormError] = useState('');
    // State for Add Vehicle modal
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [vehicleForm, setVehicleForm] = useState({ vehicleId: '', type: '', status: 'active', currentLocation: { latitude: '', longitude: '' } });
    const [vehicleFormLoading, setVehicleFormLoading] = useState(false);
    const [vehicleFormError, setVehicleFormError] = useState('');
    // State for Add Maintenance Log modal
    const [showAddMaintenanceLog, setShowAddMaintenanceLog] = useState(false);
    const [maintenanceLogForm, setMaintenanceLogForm] = useState({
        vehicle: '',
        description: '',
        serviceProvider: '',
        cost: '',
        date: '',
        nextScheduledMaintenance: ''
    });
    const [maintenanceLogFormLoading, setMaintenanceLogFormLoading] = useState(false);
    const [maintenanceLogFormError, setMaintenanceLogFormError] = useState('');
    const [availableVehicles, setAvailableVehicles] = useState([]);

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

    // Fetch commanders on mount
    useEffect(() => {
        async function fetchCommanders() {
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                // Fetch all users, filter for commanders
                const res = await fetch(`${API_BASE}/users/all-users`, { headers });
                const users = await res.json();
                if (Array.isArray(users)) {
                    setCommanders(users.filter(u => u.role === 'commander'));
                }
            } catch (err) {
                setCommanders([]);
            }
        }
        fetchCommanders();
    }, []);

    // Fetch available vehicles for maintenance log modal
    useEffect(() => {
        if (showAddMaintenanceLog) {
            async function fetchVehicles() {
                try {
                    const token = localStorage.getItem('token');
                    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                    const res = await fetch(`${API_BASE}/vehicles/all-vehicles`, { headers });
                    const vehicles = await res.json();
                    setAvailableVehicles(Array.isArray(vehicles) ? vehicles : []);
                } catch (err) {
                    setAvailableVehicles([]);
                }
            }
            fetchVehicles();
        }
    }, [showAddMaintenanceLog]);

    // Handler for form input changes
    function handleFormChange(e) {
        const { name, value } = e.target;
        if (name.startsWith("route")) {
            // route0-latitude, route0-longitude, route1-latitude, route1-longitude
            const [routeIdx, field] = name.match(/route(\d+)-(latitude|longitude)/).slice(1);
            setConvoyForm(prev => {
                const newRoute = [...prev.route];
                newRoute[parseInt(routeIdx)][field] = value;
                return { ...prev, route: newRoute };
            });
        } else {
            setConvoyForm(prev => ({ ...prev, [name]: value }));
        }
    }
    // Handler for form submission
    async function handleAddConvoy(e) {
        e.preventDefault();
        setFormLoading(true);
        setFormError("");
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            // Prepare data: parse route
            const routeArr = convoyForm.route.map(pt => ({
                latitude: parseFloat(pt.latitude),
                longitude: parseFloat(pt.longitude)
            }));
            const body = JSON.stringify({
                name: convoyForm.name,
                status: convoyForm.status,
                route: routeArr,
                commander: convoyForm.commander // Include commander
            });
            const res = await fetch(`${API_BASE}/convoys/create`, {
                method: 'POST',
                headers,
                body
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create convoy');
            }
            // Success: close modal, refresh stats
            setShowAddConvoy(false);
            setConvoyForm({
                name: "",
                status: "active",
                route: [
                    { latitude: "", longitude: "" },
                    { latitude: "", longitude: "" },
                ],
                commander: "",
            });
            fetchStats(); // Refresh dashboard stats
        } catch (err) {
            setFormError(err.message);
        } finally {
            setFormLoading(false);
        }
    }

    // Handlers for User form
    function handleUserFormChange(e) {
        const { name, value } = e.target;
        setUserForm(prev => ({ ...prev, [name]: value }));
    }
    async function handleAddUser(e) {
        e.preventDefault();
        setUserFormLoading(true);
        setUserFormError('');
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
            const body = JSON.stringify(userForm);
            const res = await fetch(`${API_BASE}/users/create`, { method: 'POST', headers, body });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create user');
            }
            setShowAddUser(false);
            setUserForm({ name: '', username: '', email: '', rank: '', role: 'commander', password: '' });
            fetchStats();
        } catch (err) {
            setUserFormError(err.message);
        } finally {
            setUserFormLoading(false);
        }
    }
    // Handlers for Vehicle form
    function handleVehicleFormChange(e) {
        const { name, value } = e.target;
        if (name === 'latitude' || name === 'longitude') {
            setVehicleForm(prev => ({
                ...prev,
                currentLocation: { ...prev.currentLocation, [name]: value }
            }));
        } else {
            setVehicleForm(prev => ({ ...prev, [name]: value }));
        }
    }
    async function handleAddVehicle(e) {
        e.preventDefault();
        setVehicleFormLoading(true);
        setVehicleFormError('');
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
            // Prepare data: parse currentLocation to numbers
            const body = JSON.stringify({
                vehicleId: vehicleForm.vehicleId,
                type: vehicleForm.type,
                status: vehicleForm.status, // must match backend enum
                currentLocation: {
                    latitude: parseFloat(vehicleForm.currentLocation.latitude),
                    longitude: parseFloat(vehicleForm.currentLocation.longitude)
                }
            });
            const res = await fetch(`${API_BASE}/vehicles/create`, { method: 'POST', headers, body });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create vehicle');
            }
            setShowAddVehicle(false);
            setVehicleForm({ vehicleId: '', type: '', status: 'active', currentLocation: { latitude: '', longitude: '' } });
            fetchStats();
        } catch (err) {
            setVehicleFormError(err.message);
        } finally {
            setVehicleFormLoading(false);
        }
    }
    // Handlers for Maintenance Log form
    function handleMaintenanceLogFormChange(e) {
        const { name, value } = e.target;
        setMaintenanceLogForm(prev => ({ ...prev, [name]: value }));
    }
    async function handleAddMaintenanceLog(e) {
        e.preventDefault();
        setMaintenanceLogFormLoading(true);
        setMaintenanceLogFormError('');
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
            const formToSend = { ...maintenanceLogForm };
            if (formToSend.cost === '') delete formToSend.cost;
            else formToSend.cost = Number(formToSend.cost);
            if (!formToSend.date) delete formToSend.date;
            if (!formToSend.nextScheduledMaintenance) delete formToSend.nextScheduledMaintenance;
            const body = JSON.stringify(formToSend);
            const res = await fetch(`${API_BASE}/logs/create`, { method: 'POST', headers, body });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create maintenance log');
            }
            setShowAddMaintenanceLog(false);
            setMaintenanceLogForm({ vehicle: '', description: '', serviceProvider: '', cost: '', date: '', nextScheduledMaintenance: '' });
            fetchStats();
        } catch (err) {
            setMaintenanceLogFormError(err.message);
        } finally {
            setMaintenanceLogFormLoading(false);
        }
    }

    const navigate = useNavigate();

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
                        {/* Removed Add Convoy button from here */}
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
                        <button style={{
                            background: '#166534',
                            color: 'white',
                            border: '2px solid #d1fae5', // keep this if you want the border
                            borderRadius: '6px',
                            padding: '10px 18px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            marginBottom: '10px',
                            marginRight: '8px',
                            cursor: 'pointer',
                            width: '100%'
                        }} onClick={() => navigate('/convoys')}>View Convoys</button>
                        <button style={{ background: '#166534', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 18px', fontSize: '1rem', fontWeight: 600, marginBottom: '10px', marginRight: '8px', cursor: 'pointer', width: '100%' }} onClick={() => setShowAddConvoy(true)}>Add Convoy</button>
                    </div>
                    <div style={{ background: '#11251e', borderRadius: '10px', padding: '1.5rem 2.5rem', minWidth: '220px', border: '1px solid #14532d', color: '#d1fae5', marginBottom: '1rem' }}>
                        <h3 style={{ color: '#22c55e', fontSize: '1.15rem', fontWeight: 600, marginBottom: '18px' }}>Vehicle Management</h3>
                        <button style={{ background: '#166534', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 18px', fontSize: '1rem', fontWeight: 600, marginBottom: '10px', marginRight: '8px', cursor: 'pointer', width: '100%' }} onClick={() => navigate('/vehicles')}>View Vehicles</button>
                        <button style={{ background: '#166534', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 18px', fontSize: '1rem', fontWeight: 600, marginBottom: '10px', marginRight: '8px', cursor: 'pointer', width: '100%' }} onClick={() => setShowAddVehicle(true)}>Add Vehicle</button>
                    </div>
                    <div style={{ background: '#11251e', borderRadius: '10px', padding: '1.5rem 2.5rem', minWidth: '220px', border: '1px solid #14532d', color: '#d1fae5', marginBottom: '1rem' }}>
                        <h3 style={{ color: '#22c55e', fontSize: '1.15rem', fontWeight: 600, marginBottom: '18px' }}>User Management</h3>
                        <button style={{ background: '#166534', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 18px', fontSize: '1rem', fontWeight: 600, marginBottom: '10px', marginRight: '8px', cursor: 'pointer', width: '100%' }} onClick={() => navigate('/users')}>View Users</button>
                        <button style={{ background: '#166534', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 18px', fontSize: '1rem', fontWeight: 600, marginBottom: '10px', marginRight: '8px', cursor: 'pointer', width: '100%' }} onClick={() => setShowAddUser(true)}>Add User</button>
                    </div>
                    {/* Maintenance Logs Management */}
                    <div style={{ background: '#11251e', borderRadius: '10px', padding: '1.5rem 2.5rem', minWidth: '220px', border: '1px solid #14532d', color: '#d1fae5', marginBottom: '1rem' }}>
                        <h3 style={{ color: '#22c55e', fontSize: '1.15rem', fontWeight: 600, marginBottom: '18px' }}>Maintenance Logs Management</h3>
                        <button style={{ background: '#166534', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 18px', fontSize: '1rem', fontWeight: 600, marginBottom: '10px', marginRight: '8px', cursor: 'pointer', width: '100%' }} onClick={() => navigate('/maintenance-logs')}>View Logs</button>
                        <button style={{ background: '#166534', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 18px', fontSize: '1rem', fontWeight: 600, marginBottom: '10px', marginRight: '8px', cursor: 'pointer', width: '100%' }} onClick={() => setShowAddMaintenanceLog(true)}>Add Log</button>
                    </div>
                    <div style={{ background: '#11251e', borderRadius: '10px', padding: '1.5rem 2.5rem', minWidth: '220px', border: '1px solid #14532d', color: '#d1fae5', marginBottom: '1rem' }}>
                        <h3 style={{ color: '#22c55e', fontSize: '1.15rem', fontWeight: 600, marginBottom: '18px' }}>Recent Activity</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#d1fae5', fontSize: '0.98rem' }}>
                            <li>No recent activity.</li>
                        </ul>
                    </div>
                </section>
                {/* Add Convoy Modal */}
                {showAddConvoy && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <form onSubmit={handleAddConvoy} style={{ background: '#1a2e25', padding: '2rem', borderRadius: '12px', minWidth: '340px', color: '#d1fae5', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 2px 16px #0008' }}>
                            <h2 style={{ color: '#22c55e', marginBottom: '1rem' }}>Add New Convoy</h2>
                            <label>Name:
                                <input name="name" value={convoyForm.name} onChange={handleFormChange} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
                            </label>
                            <label>Status:
                                <select name="status" value={convoyForm.status} onChange={handleFormChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }}>
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </label>
                            <label>Commander:
                                <select name="commander" value={convoyForm.commander} onChange={handleFormChange} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }}>
                                    <option value="">Select Commander</option>
                                    {commanders.map(cmdr => (
                                        <option key={cmdr._id} value={cmdr._id}>{cmdr.name} ({cmdr._id})</option>
                                    ))}
                                </select>
                            </label>
                            <label>Route Start (Latitude, Longitude):
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input name="route0-latitude" value={convoyForm.route[0].latitude} onChange={handleFormChange} required placeholder="Latitude" style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #14532d' }} />
                                    <input name="route0-longitude" value={convoyForm.route[0].longitude} onChange={handleFormChange} required placeholder="Longitude" style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #14532d' }} />
                                </div>
                            </label>
                            <label>Route End (Latitude, Longitude):
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input name="route1-latitude" value={convoyForm.route[1].latitude} onChange={handleFormChange} required placeholder="Latitude" style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #14532d' }} />
                                    <input name="route1-longitude" value={convoyForm.route[1].longitude} onChange={handleFormChange} required placeholder="Longitude" style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #14532d' }} />
                                </div>
                            </label>
                            {formError && <div style={{ color: '#f87171', marginBottom: '0.5rem' }}>{formError}</div>}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" disabled={formLoading} style={{ background: '#22c55e', color: '#11251e', fontWeight: 700, border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Create Convoy</button>
                                <button type="button" onClick={() => setShowAddConvoy(false)} style={{ background: '#14532d', color: '#d1fae5', border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
                {/* Add User Modal */}
                {showAddUser && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <form onSubmit={handleAddUser} style={{ background: '#1a2e25', padding: '2rem', borderRadius: '12px', minWidth: '340px', color: '#d1fae5', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 2px 16px #0008' }}>
                            <h2 style={{ color: '#22c55e', marginBottom: '1rem' }}>Add New User</h2>
                            <label>Name:
                                <input name="name" value={userForm.name} onChange={handleUserFormChange} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
                            </label>
                            <label>Username:
                                <input name="username" value={userForm.username} onChange={handleUserFormChange} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
                            </label>
                            <label>Rank:
                                <input name="rank" value={userForm.rank} onChange={handleUserFormChange} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
                            </label>
                            <label>Email:
                                <input name="email" value={userForm.email} onChange={handleUserFormChange} required type="email" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
                            </label>
                            <label>Role:
                                <select name="role" value={userForm.role} onChange={handleUserFormChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }}>
                                    <option value="admin">Admin</option>
                                    <option value="commander">Commander</option>
                                    <option value="logistics">Logistics</option>
                                </select>
                            </label>
                            <label>Password:
                                <input name="password" value={userForm.password} onChange={handleUserFormChange} required type="password" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
                            </label>
                            {userFormError && <div style={{ color: '#f87171', marginBottom: '0.5rem' }}>{userFormError}</div>}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" disabled={userFormLoading} style={{ background: '#22c55e', color: '#11251e', fontWeight: 700, border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Create User</button>
                                <button type="button" onClick={() => setShowAddUser(false)} style={{ background: '#14532d', color: '#d1fae5', border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
                {/* Add Vehicle Modal */}
                {showAddVehicle && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <form onSubmit={handleAddVehicle} style={{ background: '#1a2e25', padding: '2rem', borderRadius: '12px', minWidth: '340px', color: '#d1fae5', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 2px 16px #0008' }}>
                            <h2 style={{ color: '#22c55e', marginBottom: '1rem' }}>Add New Vehicle</h2>
                            <label>Vehicle ID:
                                <input name="vehicleId" value={vehicleForm.vehicleId} onChange={handleVehicleFormChange} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
                            </label>
                            <label>Type:
                                <input name="type" value={vehicleForm.type} onChange={handleVehicleFormChange} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
                            </label>
                            <label>Status:
                                <select name="status" value={vehicleForm.status} onChange={handleVehicleFormChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }}>
                                    <option value="operational">Operational</option>
                                    <option value="damaged">Damaged</option>
                                    <option value="low_fuel">Low Fuel</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </label>
                            <label>Latitude:
                                <input name="latitude" value={vehicleForm.currentLocation.latitude} onChange={handleVehicleFormChange} required type="number" step="any" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
                            </label>
                            <label>Longitude:
                                <input name="longitude" value={vehicleForm.currentLocation.longitude} onChange={handleVehicleFormChange} required type="number" step="any" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
                            </label>
                            {vehicleFormError && <div style={{ color: '#f87171', marginBottom: '0.5rem' }}>{vehicleFormError}</div>}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" disabled={vehicleFormLoading} style={{ background: '#22c55e', color: '#11251e', fontWeight: 700, border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Create Vehicle</button>
                                <button type="button" onClick={() => setShowAddVehicle(false)} style={{ background: '#14532d', color: '#d1fae5', border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
                {/* Add Maintenance Log Modal */}
                {showAddMaintenanceLog && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <form onSubmit={handleAddMaintenanceLog} style={{ background: '#1a2e25', padding: '2rem', borderRadius: '12px', minWidth: '340px', color: '#d1fae5', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 2px 16px #0008' }}>
                            <h2 style={{ color: '#22c55e', marginBottom: '1rem' }}>Add New Maintenance Log</h2>
                            <label>Vehicle:
                                <select name="vehicle" value={maintenanceLogForm.vehicle} onChange={handleMaintenanceLogFormChange} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }}>
                                    <option value="">Select Vehicle</option>
                                    {availableVehicles.map(v => (
                                        <option key={v._id || v.vehicleId} value={v._id || v.vehicleId}>{v.vehicleId || v._id}</option>
                                    ))}
                                </select>
                            </label>
                            <label>Description:
                                <select name="description" value={maintenanceLogForm.description} onChange={handleMaintenanceLogFormChange} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }}>
                                    <option value="">Select Description</option>
                                    <option value="Oil Change">Oil Change</option>
                                    <option value="Tire Rotation">Tire Rotation</option>
                                    <option value="Brake Inspection">Brake Inspection</option>
                                    <option value="Engine Tune-up">Engine Tune-up</option>
                                    <option value="Transmission Service">Transmission Service</option>
                                    <option value="Battery Replacement">Battery Replacement</option>
                                    <option value="Fluid Check">Fluid Check</option>
                                    <option value="Filter Replacement">Filter Replacement</option>
                                    <option value="Other">Other</option>
                                </select>
                            </label>
                            <label>Service Provider:
                                <input name="serviceProvider" value={maintenanceLogForm.serviceProvider} onChange={handleMaintenanceLogFormChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
                            </label>
                            <label>Cost:
                                <input name="cost" value={maintenanceLogForm.cost} onChange={handleMaintenanceLogFormChange} type="number" min="0" step="any" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
                            </label>
                            <label>Date:
                                <input name="date" value={maintenanceLogForm.date} onChange={handleMaintenanceLogFormChange} type="datetime-local" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
                            </label>
                            <label>Next Scheduled Maintenance:
                                <input name="nextScheduledMaintenance" value={maintenanceLogForm.nextScheduledMaintenance} onChange={handleMaintenanceLogFormChange} type="date" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
                            </label>
                            {maintenanceLogFormError && <div style={{ color: '#f87171', marginBottom: '0.5rem' }}>{maintenanceLogFormError}</div>}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="submit" disabled={maintenanceLogFormLoading} style={{ background: '#22c55e', color: '#11251e', fontWeight: 700, border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Create Log</button>
                                <button type="button" onClick={() => setShowAddMaintenanceLog(false)} style={{ background: '#14532d', color: '#d1fae5', border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
            <div className="footer-spacer" />
            <footer className="app-footer">
                <p>&copy; {new Date().getFullYear()} OpsTrack. All access monitored.</p>
            </footer>
        </div>
    )
}

export default AdminDashboard;