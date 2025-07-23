import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRef } from 'react';

function ConvoyList() {
  const [convoys, setConvoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedConvoy, setSelectedConvoy] = useState(null);
  // Add state for vehicles of selected convoy
  const [selectedConvoyVehicles, setSelectedConvoyVehicles] = useState([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleError, setVehicleError] = useState("");
  // State for editing
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ convoyId: '', name: '', commander: '', status: 'active', startLat: '', startLng: '', endLat: '', endLng: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [commanders, setCommanders] = useState([]);
  const [deleteError, setDeleteError] = useState('');

  // Fetch commanders
  useEffect(() => {
    async function fetchCommanders() {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch('http://localhost:8080/api/users/all-users', { headers });
        const users = await res.json();
        if (Array.isArray(users)) {
          setCommanders(users.filter(u => u.role === 'commander'));
        }
      } catch (err) {
        setCommanders([]);
      }
    }
    if (editModalOpen) fetchCommanders();
  }, [editModalOpen]);

  // Fetch vehicles for selected convoy
  useEffect(() => {
    async function fetchVehiclesForConvoy(convoyId) {
      setVehicleLoading(true);
      setVehicleError("");
      setSelectedConvoyVehicles([]);
      if (!convoyId) return;
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`http://localhost:8080/api/vehicles/convoy/${convoyId}`, { headers });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || err.message || 'Failed to fetch vehicles');
        }
        const data = await res.json();
        setSelectedConvoyVehicles(Array.isArray(data) ? data : []);
      } catch (err) {
        setVehicleError(err.message || 'Failed to fetch vehicles');
        setSelectedConvoyVehicles([]);
      } finally {
        setVehicleLoading(false);
      }
    }
    if (selectedConvoy && selectedConvoy._id) {
      fetchVehiclesForConvoy(selectedConvoy._id);
    } else {
      setSelectedConvoyVehicles([]);
      setVehicleError("");
    }
  }, [selectedConvoy]);

  // Open edit modal and populate form
  function openEditModal(convoy) {
    setEditForm({
      convoyId: convoy._id,
      name: convoy.name || '',
      commander: convoy.commander?._id || convoy.commander || '',
      status: convoy.status || 'active',
      startLat: convoy.route?.[0]?.latitude || '',
      startLng: convoy.route?.[0]?.longitude || '',
      endLat: convoy.route?.[1]?.latitude || '',
      endLng: convoy.route?.[1]?.longitude || ''
    });
    setEditModalOpen(true);
    setEditError('');
  }
  // Handle form changes
  function handleEditFormChange(e) {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  }
  // Submit edit
  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    // Validation: name uniqueness
    const nameExists = convoys.some(c => c.name.trim().toLowerCase() === editForm.name.trim().toLowerCase() && c._id !== editForm.convoyId);
    if (nameExists) {
      setEditError('A convoy with this name already exists.');
      setEditLoading(false);
      return;
    }
    // Validation: commander uniqueness
    const commanderAssigned = convoys.some(c => (c.commander?._id || c.commander) === editForm.commander && c._id !== editForm.convoyId);
    if (commanderAssigned) {
      setEditError('This commander is already assigned to another convoy.');
      setEditLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
      const body = JSON.stringify({
        name: editForm.name,
        commander: editForm.commander,
        status: editForm.status,
        route: [
          { latitude: parseFloat(editForm.startLat), longitude: parseFloat(editForm.startLng) },
          { latitude: parseFloat(editForm.endLat), longitude: parseFloat(editForm.endLng) }
        ]
      });
      const res = await fetch(`http://localhost:8080/api/convoys/${editForm.convoyId}`, {
        method: 'PATCH',
        headers,
        body
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update convoy');
      }
      setEditModalOpen(false);
      setEditForm({ convoyId: '', name: '', commander: '', status: 'active', startLat: '', startLng: '', endLat: '', endLng: '' });
      // Refresh convoys and keep selected convoy updated
      await fetchConvoys();
      if (selectedConvoy && selectedConvoy._id === editForm.convoyId) {
        const updated = convoys.find(c => c._id === editForm.convoyId);
        setSelectedConvoy(updated || null);
      }
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  }

  // Centralized fetch function
  async function fetchConvoys() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch('http://localhost:8080/api/convoys/all-convoys', { headers });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || 'Failed to fetch convoys');
      }
      const data = await res.json();
      setConvoys(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch convoys');
      setConvoys([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConvoys();
  }, []);

  async function handleDeleteConvoy(convoyId) {
    if (!window.confirm('Are you sure you want to delete this convoy?')) return;
    setDeleteError('');
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`http://localhost:8080/api/convoys/${convoyId}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete convoy');
      }
      await fetchConvoys();
      if (selectedConvoy && selectedConvoy._id === convoyId) setSelectedConvoy(null);
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  // Custom blinking icon for selected convoy
  const blinkingIcon = new L.DivIcon({
    className: 'blinking-marker',
    iconSize: [24, 24],
    html: '<div class="blinking-dot"></div>'
  });

  // Helper to center map on selected convoy
  function MapCenterer({ position }) {
    const map = useMap();
    if (position) {
      map.setView(position, 12, { animate: true });
    }
    return null;
  }

  // Helper: check if a point is within India's bounding box
  function isWithinIndia(lat, lng) {
    // India's rough bounding box: 6.5N-37.1N, 68.1E-97.4E
    return lat >= 6.5 && lat <= 37.1 && lng >= 68.1 && lng <= 97.4;
  }

  // Routing component for selected convoy
  function Routing({ start, end, color = '#2196f3' }) {
    const map = useMap();
    const routingRef = useRef(null);
    const [routeWarning, setRouteWarning] = useState("");

    useEffect(() => {
      if (!map || !start || !end) return;
      // Remove previous routing control if exists
      if (routingRef.current) {
        map.removeControl(routingRef.current);
      }
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(start.latitude, start.longitude),
          L.latLng(end.latitude, end.longitude)
        ],
        router: L.Routing.osrmv1({
          serviceUrl: 'http://router.project-osrm.org/route/v1'
        }),
        lineOptions: {
          styles: [{ color: '#2196f3', weight: 6, opacity: 0.95 }]
        },
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: false,
        createMarker: () => null,
        profile: 'car',
        language: 'en',
        itineraryFormatter: null,
        // Remove the default panel
        itinerary: null,
        collapsible: false
      })
        .on('routesfound', function (e) {
          // Check if all coordinates are within India
          const allCoords = e.routes[0].coordinates;
          const allInIndia = allCoords.every(pt => isWithinIndia(pt.lat, pt.lng));
          if (!allInIndia) {
            setRouteWarning('Warning: Route leaves India!');
          } else {
            setRouteWarning("");
          }
        })
        .addTo(map);
      // Remove the directions box if it appears
      const panel = document.querySelector('.leaflet-routing-container');
      if (panel) panel.style.display = 'none';
      routingRef.current = routingControl;
      return () => {
        if (routingRef.current) {
          map.removeControl(routingRef.current);
        }
      };
    }, [map, start, end]);

    // Show warning on map if route leaves India
    return routeWarning ? (
      <div style={{ position: 'absolute', top: 10, left: 10, background: '#ef4444', color: '#fff', padding: '8px 16px', borderRadius: '6px', zIndex: 9999 }}>
        {routeWarning}
      </div>
    ) : null;
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      minHeight: '100vh',
      background: '#11251e',
      color: '#d1fae5',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <h1 style={{ color: '#22c55e', margin: '2rem 0 0.5rem 2rem', fontSize: '2.5rem' }}>All Convoys</h1>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', margin: '0 2rem 1.5rem 2rem', justifyContent: 'space-between' }}>
        <h2 style={{ color: '#22c55e', fontSize: '1.5rem', margin: 0 }}>Convoy Details</h2>
        <h2 style={{ color: '#22c55e', fontSize: '1.5rem', margin: 0 }}>Convoy Locations Map</h2>
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          gap: '2rem',
          padding: '0 2rem 2rem 2rem',
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {/* Table Section */}
        <div style={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
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
                  <th style={{ padding: '10px', color: '#22c55e', maxWidth: '180px', minWidth: 0 }}>Action</th>
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
                    <td style={{ padding: '10px', display: 'flex', gap: '0.4rem', maxWidth: '180px', minWidth: 0, flexWrap: 'nowrap' }}>
                      <button onClick={() => { setSelectedConvoy(convoy); }} style={{ background: selectedConvoy?._id === convoy._id ? '#22c55e' : '#166534', color: '#11251e', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', minWidth: 0, whiteSpace: 'nowrap' }}>
                        {selectedConvoy?._id === convoy._id ? 'Selected' : 'Select'}
                      </button>
                      <button onClick={() => openEditModal(convoy)} style={{ background: '#fbbf24', color: '#11251e', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', minWidth: 0, whiteSpace: 'nowrap' }}>Edit</button>
                      <button onClick={() => handleDeleteConvoy(convoy._id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', minWidth: 0, whiteSpace: 'nowrap' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {deleteError && <div style={{ color: '#ef4444', margin: '1rem 0', textAlign: 'center' }}>{deleteError}</div>}
        </div>
        {/* Map Section */}
        <div style={{ flex: 1.2, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ flex: 1, minHeight: 0, height: '100%' }}>
            <MapContainer center={[34.083656, 74.797371]} zoom={8} style={{ height: '60vh', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              {/* Center map on selected convoy */}
              {selectedConvoy && selectedConvoy.route && selectedConvoy.route[0] && (
                <MapCenterer position={[selectedConvoy.route[0].latitude, selectedConvoy.route[0].longitude]} />
              )}
              {convoys.map(convoy => (
                <>
                  {/* Blinking marker for selected convoy's start */}
                  {selectedConvoy && selectedConvoy._id === convoy._id && convoy.route && convoy.route[0] && (
                    <Marker
                      key={convoy._id + '-start-blink'}
                      position={[convoy.route[0].latitude, convoy.route[0].longitude]}
                      icon={blinkingIcon}
                    >
                      <Popup>
                        <b>{convoy.name} (Start)</b><br />
                        {convoy.commander?.name && (<span>Commander: {convoy.commander.name}</span>)}
                      </Popup>
                    </Marker>
                  )}
                  {/* Normal marker for all start points (distinct color) */}
                  {convoy.route && convoy.route[0] && (
                    <Marker
                      key={convoy._id + '-start'}
                      position={[convoy.route[0].latitude, convoy.route[0].longitude]}
                      icon={new L.DivIcon({
                        className: 'start-marker',
                        iconSize: [18, 18],
                        html: '<div style="background:#2196f3;border-radius:50%;width:14px;height:14px;border:2px solid #fff;"></div>'
                      })}
                    >
                      <Popup>
                        <b>{convoy.name} (Start)</b><br />
                        {convoy.commander?.name && (<span>Commander: {convoy.commander.name}</span>)}
                      </Popup>
                    </Marker>
                  )}
                  {/* End marker for all convoys */}
                  {convoy.route && convoy.route[1] && (
                    <Marker
                      key={convoy._id + '-end'}
                      position={[convoy.route[1].latitude, convoy.route[1].longitude]}
                    >
                      <Popup>
                        <b>{convoy.name} (End)</b><br />
                        {convoy.commander?.name && (<span>Commander: {convoy.commander.name}</span>)}
                      </Popup>
                    </Marker>
                  )}
                  {/* Route: Use Routing for selected, Polyline for others */}
                  {convoy.route && convoy.route.length === 2 && (
                    <>
                      {selectedConvoy && selectedConvoy._id === convoy._id ? (
                        <Routing
                          start={convoy.route[0]}
                          end={convoy.route[1]}
                          color="#2196f3"
                        />
                      ) : (
                        <Polyline
                          positions={[
                            [convoy.route[0].latitude, convoy.route[0].longitude],
                            [convoy.route[1].latitude, convoy.route[1].longitude],
                          ]}
                          pathOptions={{ color: '#fbbf24', weight: 4, opacity: 0.7 }}
                        />
                      )}
                    </>
                  )}
                </>
              ))}
              {/* Vehicle markers for selected convoy */}
              {selectedConvoyVehicles && selectedConvoyVehicles.length > 0 && selectedConvoyVehicles.map(vehicle => (
                vehicle.currentLocation && (
                  <Marker
                    key={vehicle._id + '-vehicle'}
                    position={[vehicle.currentLocation.latitude, vehicle.currentLocation.longitude]}
                    icon={new L.DivIcon({
                      className: 'vehicle-marker',
                      iconSize: [18, 18],
                      html: '<div style="background:#fbbf24;border-radius:50%;width:14px;height:14px;border:2px solid #fff;"></div>'
                    })}
                  >
                    <Popup>
                      <b>Vehicle: {vehicle.vehicleId}</b><br />
                      Type: {vehicle.type}<br />
                      Status: {vehicle.status}<br />
                      Lat: {vehicle.currentLocation.latitude}<br />
                      Lng: {vehicle.currentLocation.longitude}
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
          {/* Vehicle list for selected convoy */}
          <div style={{ background: '#1a2e25', color: '#d1fae5', borderRadius: '8px', marginTop: '1rem', padding: '1rem', minHeight: '80px' }}>
            <h3 style={{ color: '#fbbf24', margin: 0, marginBottom: '0.5rem' }}>Vehicles in Selected Convoy</h3>
            {vehicleLoading ? (
              <div>Loading vehicles...</div>
            ) : vehicleError ? (
              <div style={{ color: '#ef4444' }}>{vehicleError}</div>
            ) : selectedConvoyVehicles.length === 0 ? (
              <div>No vehicles assigned to this convoy.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #14532d' }}>
                    <th style={{ padding: '6px', color: '#fbbf24' }}>Vehicle ID</th>
                    <th style={{ padding: '6px', color: '#fbbf24' }}>Type</th>
                    <th style={{ padding: '6px', color: '#fbbf24' }}>Status</th>
                    <th style={{ padding: '6px', color: '#fbbf24' }}>Latitude</th>
                    <th style={{ padding: '6px', color: '#fbbf24' }}>Longitude</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedConvoyVehicles.map(vehicle => (
                    <tr key={vehicle._id}>
                      <td style={{ padding: '6px' }}>{vehicle.vehicleId}</td>
                      <td style={{ padding: '6px' }}>{vehicle.type}</td>
                      <td style={{ padding: '6px' }}>{vehicle.status}</td>
                      <td style={{ padding: '6px' }}>{vehicle.currentLocation?.latitude ?? 'N/A'}</td>
                      <td style={{ padding: '6px' }}>{vehicle.currentLocation?.longitude ?? 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      {/* Responsive styles */}
      <style>{`
                @media (max-width: 900px) {
                    div[style*='flex-direction: row'] {
                        flex-direction: column !important;
                        gap: 1.5rem !important;
                    }
                    div[style*='flex: 1.2'] {
                        min-width: 0 !important;
                        width: 100% !important;
                    }
                    div[style*='flex: 1'] {
                        min-width: 0 !important;
                        width: 100% !important;
                    }
                    .leaflet-container {
                        height: 40vh !important;
                    }
                }
            `}</style>
      {/* Edit Modal */}
      {editModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <form onSubmit={handleEditSubmit} style={{ background: '#1a2e25', padding: '2rem', borderRadius: '12px', minWidth: '340px', color: '#d1fae5', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxShadow: '0 2px 16px #0008' }}>
            <h2 style={{ color: '#22c55e', marginBottom: '1rem', textAlign: 'center' }}>Edit Convoy Coordinates</h2>
            <label>Convoy Name:
              <input name="name" value={editForm.name} onChange={handleEditFormChange} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }} />
            </label>
            <label>Status:
              <select name="status" value={editForm.status} onChange={handleEditFormChange} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label>Commander:
              <select name="commander" value={editForm.commander} onChange={handleEditFormChange} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }}>
                <option value="">Select Commander</option>
                {commanders.map(cmdr => (
                  <option key={cmdr._id} value={cmdr._id}>{cmdr.name} ({cmdr._id})</option>
                ))}
              </select>
            </label>
            <label>Start Latitude:
              <input name="startLat" value={editForm.startLat} onChange={handleEditFormChange} required type="number" step="any" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }} />
            </label>
            <label>Start Longitude:
              <input name="startLng" value={editForm.startLng} onChange={handleEditFormChange} required type="number" step="any" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }} />
            </label>
            <label>End Latitude:
              <input name="endLat" value={editForm.endLat} onChange={handleEditFormChange} required type="number" step="any" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }} />
            </label>
            <label>End Longitude:
              <input name="endLng" value={editForm.endLng} onChange={handleEditFormChange} required type="number" step="any" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px', background: '#11251e', color: '#d1fae5' }} />
            </label>
            {editError && <div style={{ color: '#f87171', marginBottom: '0.5rem', textAlign: 'center' }}>{editError}</div>}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" disabled={editLoading} style={{ background: '#22c55e', color: '#11251e', fontWeight: 700, border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Save</button>
              <button type="button" onClick={() => setEditModalOpen(false)} style={{ background: '#14532d', color: '#d1fae5', border: 'none', borderRadius: '6px', padding: '10px 18px', cursor: 'pointer', flex: 1 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ConvoyList;

/* Add blinking marker CSS */
<style>{`
.blinking-marker .blinking-dot {
  width: 18px;
  height: 18px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 8px 4px #22c55e88;
  animation: blink 1s infinite alternate;
  border: 2px solid #fff;
}
@keyframes blink {
  0% { opacity: 1; box-shadow: 0 0 8px 4px #22c55e88; }
  100% { opacity: 0.3; box-shadow: 0 0 16px 8px #22c55e44; }
}
`}</style>