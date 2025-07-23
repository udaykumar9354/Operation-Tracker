import { useEffect, useState } from 'react';

function MaintenanceLogsList() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchLogs();
    }, []);

    async function fetchLogs() {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch('http://localhost:8080/api/logs/all-logs', { headers });
            const data = await res.json();
            if (Array.isArray(data)) {
                setLogs(data);
            } else {
                setLogs([]);
                setError(data.message || 'No logs found');
            }
        } catch (err) {
            setError('Failed to fetch maintenance logs');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ width: '100vw', minHeight: '100vh', background: '#11251e', color: '#d1fae5', padding: '2rem', fontFamily: 'Rajdhani, sans-serif' }}>
            <h1 style={{ color: '#fbbf24', marginBottom: '2.5rem', fontSize: '2.5rem', fontWeight: 700, letterSpacing: '1px' }}>All Maintenance Logs</h1>
            {loading ? (
                <div style={{ textAlign: 'center', fontSize: '1.3rem', color: '#fbbf24', marginTop: '3rem' }}>Loading...</div>
            ) : error ? (
                <div style={{ color: '#ef4444', textAlign: 'center', fontSize: '1.2rem', marginTop: '3rem' }}>{error}</div>
            ) : (
                <div style={{ overflowX: 'auto', borderRadius: '12px', boxShadow: '0 2px 16px #0008', background: '#16241e', padding: '1.5rem 0.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: 'transparent' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #22c55e', background: '#18332a' }}>
                                <th style={{ padding: '14px 10px', color: '#fbbf24', fontWeight: 700, fontSize: '1.08rem', letterSpacing: '0.5px', textAlign: 'left' }}>Vehicle</th>
                                <th style={{ padding: '14px 10px', color: '#fbbf24', fontWeight: 700, fontSize: '1.08rem', letterSpacing: '0.5px', textAlign: 'left' }}>Type</th>
                                <th style={{ padding: '14px 10px', color: '#fbbf24', fontWeight: 700, fontSize: '1.08rem', letterSpacing: '0.5px', textAlign: 'left' }}>Description</th>
                                <th style={{ padding: '14px 10px', color: '#fbbf24', fontWeight: 700, fontSize: '1.08rem', letterSpacing: '0.5px', textAlign: 'left' }}>Service Provider</th>
                                <th style={{ padding: '14px 10px', color: '#fbbf24', fontWeight: 700, fontSize: '1.08rem', letterSpacing: '0.5px', textAlign: 'left' }}>Cost</th>
                                <th style={{ padding: '14px 10px', color: '#fbbf24', fontWeight: 700, fontSize: '1.08rem', letterSpacing: '0.5px', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: '14px 10px', color: '#fbbf24', fontWeight: 700, fontSize: '1.08rem', letterSpacing: '0.5px', textAlign: 'left' }}>Next Scheduled</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', color: '#fbbf24', padding: '2rem', fontSize: '1.1rem' }}>No maintenance logs found.</td>
                                </tr>
                            ) : (
                                logs.map((log, idx) => (
                                    <tr key={log._id} style={{ background: idx % 2 === 0 ? '#1a2e25' : '#18332a', borderBottom: '1px solid #14532d', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '12px 10px', fontWeight: 600, color: '#d1fae5' }}>{log.vehicle && log.vehicle.vehicleId ? log.vehicle.vehicleId : (log.vehicle || 'N/A')}</td>
                                        <td style={{ padding: '12px 10px', color: '#a7f3d0' }}>{log.vehicle && log.vehicle.type ? log.vehicle.type : 'N/A'}</td>
                                        <td style={{ padding: '12px 10px', color: '#fbbf24' }}>{log.description || 'N/A'}</td>
                                        <td style={{ padding: '12px 10px', color: '#bae6fd' }}>{log.serviceProvider || 'N/A'}</td>
                                        <td style={{ padding: '12px 10px', color: '#fbbf24', fontWeight: 600 }}>{log.cost !== undefined ? log.cost : 'N/A'}</td>
                                        <td style={{ padding: '12px 10px', color: '#d1fae5' }}>{log.date ? new Date(log.date).toLocaleString() : (log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A')}</td>
                                        <td style={{ padding: '12px 10px', color: '#a7f3d0' }}>{log.nextScheduledMaintenance ? new Date(log.nextScheduledMaintenance).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default MaintenanceLogsList;
