import { useEffect, useState } from 'react';

function VehicleList() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");
    const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
    const [maintenanceForm, setMaintenanceForm] = useState(null);
    const [maintenanceLoading, setMaintenanceLoading] = useState(false);
    const [maintenanceError, setMaintenanceError] = useState("");
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignVehicleId, setAssignVehicleId] = useState(null);
    const [convoys, setConvoys] = useState([]);
    const [selectedConvoyId, setSelectedConvoyId] = useState("");
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignError, setAssignError] = useState("");

    useEffect(() => {
        fetchVehicles();
    }, []);

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

    async function fetchConvoys() {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch('http://localhost:8080/api/convoys/all-convoys', { headers });
            const data = await res.json();
            if (Array.isArray(data)) {
                setConvoys(data);
            } else {
                setConvoys([]);
            }
        } catch (err) {
            setConvoys([]);
        }
    }

    async function handleDeleteVehicle(vehicleId) {
        if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
        setDeleteError("");
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch(`http://localhost:8080/api/vehicles/${vehicleId}`, {
                method: 'DELETE',
                headers
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to delete vehicle');
            }
            await fetchVehicles();
        } catch (err) {
            setDeleteError(err.message);
        }
    }

    function openEditModal(vehicle) {
        setEditForm({ ...vehicle });
        setEditModalOpen(true);
        setEditError("");
    }
    function handleEditFormChange(e) {
        const { name, value } = e.target;
        if (name.startsWith('currentLocation.')) {
            setEditForm(prev => ({
                ...prev,
                currentLocation: {
                    ...prev.currentLocation,
                    [name.split('.')[1]]: value
                }
            }));
        } else {
            setEditForm(prev => ({ ...prev, [name]: value }));
        }
    }
    async function handleEditSubmit(e) {
        e.preventDefault();
        setEditLoading(true);
        setEditError("");
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
            const body = JSON.stringify({
                vehicleId: editForm.vehicleId,
                type: editForm.type,
                status: editForm.status,
                fuelLevel: editForm.fuelLevel,
                supplies: editForm.supplies,
                currentLocation: {
                    latitude: parseFloat(editForm.currentLocation.latitude),
                    longitude: parseFloat(editForm.currentLocation.longitude)
                },
                convoy: editForm.convoy?._id || editForm.convoy || null
            });
            const res = await fetch(`http://localhost:8080/api/vehicles/${editForm._id}`, {
                method: 'PATCH',
                headers,
                body
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update vehicle');
            }
            setEditModalOpen(false);
            setEditForm(null);
            await fetchVehicles();
        } catch (err) {
            setEditError(err.message);
        } finally {
            setEditLoading(false);
        }
    }

    function openMaintenanceModal(vehicle) {
        setMaintenanceForm({ vehicleId: vehicle._id, description: '', serviceProvider: '', cost: '', nextScheduledMaintenance: '' });
        setMaintenanceModalOpen(true);
        setMaintenanceError("");
    }
    function handleMaintenanceFormChange(e) {
        const { name, value } = e.target;
        setMaintenanceForm(prev => ({ ...prev, [name]: value }));
    }
    async function handleMaintenanceSubmit(e) {
        e.preventDefault();
        setMaintenanceLoading(true);
        setMaintenanceError("");
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
            const body = JSON.stringify({
                vehicle: maintenanceForm.vehicleId,
                description: maintenanceForm.description,
                serviceProvider: maintenanceForm.serviceProvider,
                cost: parseFloat(maintenanceForm.cost) || 0,
                nextScheduledMaintenance: maintenanceForm.nextScheduledMaintenance || undefined
            });
            const res = await fetch('http://localhost:8080/api/logs/create', {
                method: 'POST',
                headers,
                body
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to add maintenance log');
            }
            setMaintenanceModalOpen(false);
            setMaintenanceForm(null);
        } catch (err) {
            setMaintenanceError(err.message);
        } finally {
            setMaintenanceLoading(false);
        }
    }

    async function handleUnassignConvoy(vehicle) {
        if (!vehicle.convoy) return;
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
            const body = JSON.stringify({ convoy: null });
            const res = await fetch(`http://localhost:8080/api/vehicles/${vehicle._id}`, {
                method: 'PATCH',
                headers,
                body
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to unassign convoy');
            }
            await fetchVehicles();
        } catch (err) {
            alert('Failed to unassign convoy');
        }
    }

    function openAssignModal(vehicle) {
        setAssignVehicleId(vehicle._id);
        setSelectedConvoyId("");
        setAssignModalOpen(true);
        setAssignError("");
        fetchConvoys();
    }

    async function handleAssignSubmit(e) {
        e.preventDefault();
        if (!selectedConvoyId) {
            setAssignError('Please select a convoy');
            return;
        }
        setAssignLoading(true);
        setAssignError("");
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
            const body = JSON.stringify({ vehicleId: assignVehicleId, convoyId: selectedConvoyId });
            const res = await fetch('http://localhost:8080/api/vehicles/assign', {
                method: 'POST',
                headers,
                body
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || err.message || 'Failed to assign vehicle');
            }
            setAssignModalOpen(false);
            setAssignVehicleId(null);
            setSelectedConvoyId("");
            await fetchVehicles();
        } catch (err) {
            setAssignError(err.message);
        } finally {
            setAssignLoading(false);
        }
    }

    return (
        <div style={{ width: '100vw', minHeight: '100vh', background: '#11251e', color: '#d1fae5', padding: '2rem' }}>
            <h1 style={{ color: '#22c55e', marginBottom: '2rem', fontSize: '2.5rem' }}>All Vehicles</h1>
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
                            <th style={{ padding: '10px', color: '#22c55e' }}>Fuel</th>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Supplies</th>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Location</th>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Last Updated</th>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Convoy</th>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.map(vehicle => (
                            <tr key={vehicle._id} style={{ borderBottom: '1px solid #14532d' }}>
                                <td style={{ padding: '10px' }}>{vehicle.vehicleId}</td>
                                <td style={{ padding: '10px' }}>{vehicle.type}</td>
                                <td style={{ padding: '10px' }}>{vehicle.status}</td>
                                <td style={{ padding: '10px' }}>{vehicle.fuelLevel ?? 'N/A'}</td>
                                <td style={{ padding: '10px' }}>{`F:${vehicle.supplies?.food ?? 0} M:${vehicle.supplies?.medical ?? 0} A:${vehicle.supplies?.ammo ?? 0}`}</td>
                                <td style={{ padding: '10px' }}>{vehicle.currentLocation ? `${vehicle.currentLocation.latitude}, ${vehicle.currentLocation.longitude}` : 'N/A'}</td>
                                <td style={{ padding: '10px' }}>{vehicle.lastUpdated ? new Date(vehicle.lastUpdated).toLocaleString() : 'N/A'}</td>
                                <td style={{ padding: '10px' }}>{vehicle.convoy ? (vehicle.convoy.name || 'Assigned') : 'Unassigned'}</td>
                                <td style={{ padding: '10px', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <button onClick={() => openMaintenanceModal(vehicle)} style={{ background: '#fbbf24', color: '#11251e', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>Add Maintenance</button>
                                    <button onClick={() => openEditModal(vehicle)} style={{ background: '#22c55e', color: '#11251e', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>Edit</button>
                                    <button onClick={() => handleDeleteVehicle(vehicle._id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>Delete</button>
                                    {vehicle.convoy ? (
                                        <button onClick={() => handleUnassignConvoy(vehicle)} style={{ background: '#14532d', color: '#d1fae5', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>Unassign</button>
                                    ) : (
                                        vehicle.status === 'operational' && (
                                            <button onClick={() => openAssignModal(vehicle)} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>Assign to Convoy</button>
                                        )
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {deleteError && <div style={{ color: '#ef4444', margin: '1rem 0', textAlign: 'center' }}>{deleteError}</div>}
            {/* Edit Modal */}
            {editModalOpen && editForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <form onSubmit={handleEditSubmit} style={{ background: '#1a2e25', padding: '2rem', borderRadius: '12px', minWidth: '340px', color: '#d1fae5', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxShadow: '0 2px 16px #0008' }}>
                        <h2 style={{ color: '#22c55e', marginBottom: '1rem', textAlign: 'center' }}>Edit Vehicle</h2>
                        <label>Vehicle ID:
                            <input name="vehicleId" value={editForm.vehicleId} onChange={handleEditFormChange} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }} />
                        </label>
                        <label>Type:
                            <input name="type" value={editForm.type} onChange={handleEditFormChange} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }} />
                        </label>
                        <label>Status:
                            <select name="status" value={editForm.status} onChange={handleEditFormChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }}>
                                <option value="operational">Operational</option>
                                <option value="damaged">Damaged</option>
                                <option value="low_fuel">Low Fuel</option>
                                <option value="inactive">Inactive</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </label>
                        <label>Fuel Level:
                            <input name="fuelLevel" value={editForm.fuelLevel} onChange={handleEditFormChange} type="number" min="0" max="100" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }} />
                        </label>
                        <label>Supplies:
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input name="supplies.food" value={editForm.supplies?.food ?? 0} onChange={e => setEditForm(prev => ({ ...prev, supplies: { ...prev.supplies, food: e.target.value } }))} type="number" min="0" placeholder="Food" style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #14532d', background: '#11251e', color: '#d1fae5' }} />
                                <input name="supplies.medical" value={editForm.supplies?.medical ?? 0} onChange={e => setEditForm(prev => ({ ...prev, supplies: { ...prev.supplies, medical: e.target.value } }))} type="number" min="0" placeholder="Medical" style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #14532d', background: '#11251e', color: '#d1fae5' }} />
                                <input name="supplies.ammo" value={editForm.supplies?.ammo ?? 0} onChange={e => setEditForm(prev => ({ ...prev, supplies: { ...prev.supplies, ammo: e.target.value } }))} type="number" min="0" placeholder="Ammo" style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #14532d', background: '#11251e', color: '#d1fae5' }} />
                            </div>
                        </label>
                        <label>Latitude:
                            <input name="currentLocation.latitude" value={editForm.currentLocation?.latitude ?? ''} onChange={handleEditFormChange} required type="number" step="any" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }} />
                        </label>
                        <label>Longitude:
                            <input name="currentLocation.longitude" value={editForm.currentLocation?.longitude ?? ''} onChange={handleEditFormChange} required type="number" step="any" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }} />
                        </label>
                        {editError && <div style={{ color: '#f87171', marginBottom: '0.5rem', textAlign: 'center' }}>{editError}</div>}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" disabled={editLoading} style={{ background: '#22c55e', color: '#11251e', fontWeight: 700, border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Save</button>
                            <button type="button" onClick={() => setEditModalOpen(false)} style={{ background: '#14532d', color: '#d1fae5', border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
            {/* Maintenance Modal */}
            {maintenanceModalOpen && maintenanceForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <form onSubmit={handleMaintenanceSubmit} style={{ background: '#1a2e25', padding: '2rem', borderRadius: '12px', minWidth: '340px', color: '#d1fae5', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxShadow: '0 2px 16px #0008' }}>
                        <h2 style={{ color: '#fbbf24', marginBottom: '1rem', textAlign: 'center' }}>Add Maintenance Log</h2>
                        <label>Description:
                            <select name="description" value={maintenanceForm.description} onChange={handleMaintenanceFormChange} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }}>
                                <option value="">Select</option>
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
                            <input name="serviceProvider" value={maintenanceForm.serviceProvider} onChange={handleMaintenanceFormChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }} />
                        </label>
                        <label>Cost:
                            <input name="cost" value={maintenanceForm.cost} onChange={handleMaintenanceFormChange} type="number" min="0" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }} />
                        </label>
                        <label>Next Scheduled Maintenance:
                            <input name="nextScheduledMaintenance" value={maintenanceForm.nextScheduledMaintenance} onChange={handleMaintenanceFormChange} type="date" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }} />
                        </label>
                        {maintenanceError && <div style={{ color: '#f87171', marginBottom: '0.5rem', textAlign: 'center' }}>{maintenanceError}</div>}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" disabled={maintenanceLoading} style={{ background: '#fbbf24', color: '#11251e', fontWeight: 700, border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Add</button>
                            <button type="button" onClick={() => setMaintenanceModalOpen(false)} style={{ background: '#14532d', color: '#d1fae5', border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
            {/* Assign Modal */}
            {assignModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <form onSubmit={handleAssignSubmit} style={{ background: '#1a2e25', padding: '2rem', borderRadius: '12px', minWidth: '340px', color: '#d1fae5', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxShadow: '0 2px 16px #0008' }}>
                        <h2 style={{ color: '#0ea5e9', marginBottom: '1rem', textAlign: 'center' }}>Assign to Convoy</h2>
                        <label>Convoy:
                            <select value={selectedConvoyId} onChange={e => setSelectedConvoyId(e.target.value)} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }}>
                                <option value="">Select Convoy</option>
                                {convoys.filter(convoy => convoy.status === 'active').map(convoy => (
                                    <option key={convoy._id} value={convoy._id}>{convoy.name} ({convoy.status})</option>
                                ))}
                            </select>
                        </label>
                        {assignError && <div style={{ color: '#f87171', marginBottom: '0.5rem', textAlign: 'center' }}>{assignError}</div>}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" disabled={assignLoading} style={{ background: '#0ea5e9', color: '#fff', fontWeight: 700, border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Assign</button>
                            <button type="button" onClick={() => setAssignModalOpen(false)} style={{ background: '#14532d', color: '#d1fae5', border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default VehicleList; 