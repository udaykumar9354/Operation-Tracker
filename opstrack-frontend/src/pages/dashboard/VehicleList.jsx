import { useEffect, useState } from 'react';

function VehicleList() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchVehicles() {
            setLoading(true);
            setError("");
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const res = await fetch('http://localhost:8080/api/vehicles/all-vehicles', { headers });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setVehicles(data);
                } else {
                    setVehicles([]);
                    setError(data.message || 'No vehicles found');
                }
            } catch (err) {
                setError('Failed to fetch vehicles');
                setVehicles([]);
            } finally {
                setLoading(false);
            }
        }
        fetchVehicles();
    }, []);

    return (
        <div style={{ padding: '2rem', color: '#d1fae5', background: '#11251e', minHeight: '100vh' }}>
            <h1 style={{ color: '#22c55e', marginBottom: '2rem' }}>All Vehicles</h1>
            {loading ? (
                <div>Loading...</div>
            ) : error ? (
                <div style={{ color: '#f87171' }}>{error}</div>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a2e25' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #14532d' }}>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Vehicle ID</th>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Type</th>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.map(vehicle => (
                            <tr key={vehicle._id} style={{ borderBottom: '1px solid #14532d' }}>
                                <td style={{ padding: '10px' }}>{vehicle.vehicleId}</td>
                                <td style={{ padding: '10px' }}>{vehicle.type}</td>
                                <td style={{ padding: '10px' }}>{vehicle.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default VehicleList; 