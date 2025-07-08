import { useEffect, useState } from 'react';

function ConvoyList() {
    const [convoys, setConvoys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchConvoys() {
            setLoading(true);
            setError("");
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const res = await fetch('http://localhost:8080/api/convoys/all-convoys', { headers });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setConvoys(data);
                } else {
                    setConvoys([]);
                    setError(data.message || 'No convoys found');
                }
            } catch (err) {
                setError('Failed to fetch convoys');
                setConvoys([]);
            } finally {
                setLoading(false);
            }
        }
        fetchConvoys();
    }, []);

    return (
        <div style={{ padding: '2rem', color: '#d1fae5', background: '#11251e', minHeight: '100vh' }}>
            <h1 style={{ color: '#22c55e', marginBottom: '2rem' }}>All Convoys</h1>
            {loading ? (
                <div>Loading...</div>
            ) : error ? (
                <div style={{ color: '#f87171' }}>{error}</div>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a2e25' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #14532d' }}>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Name</th>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Status</th>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Commander</th>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Route Start</th>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Route End</th>
                        </tr>
                    </thead>
                    <tbody>
                        {convoys.map(convoy => (
                            <tr key={convoy._id} style={{ borderBottom: '1px solid #14532d' }}>
                                <td style={{ padding: '10px' }}>{convoy.name}</td>
                                <td style={{ padding: '10px' }}>{convoy.status}</td>
                                <td style={{ padding: '10px' }}>{convoy.commander?.name || convoy.commander || 'N/A'}</td>
                                <td style={{ padding: '10px' }}>{convoy.route && convoy.route[0] ? `${convoy.route[0].latitude}, ${convoy.route[0].longitude}` : 'N/A'}</td>
                                <td style={{ padding: '10px' }}>{convoy.route && convoy.route[1] ? `${convoy.route[1].latitude}, ${convoy.route[1].longitude}` : 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default ConvoyList; 