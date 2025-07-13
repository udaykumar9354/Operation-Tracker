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
  // State for editing coordinates
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ convoyId: '', startLat: '', startLng: '', endLat: '', endLng: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Open edit modal and populate form
  function openEditModal(convoy) {
    setEditForm({
      convoyId: convoy._id,
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
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
      const body = JSON.stringify({
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
        throw new Error(err.error || 'Failed to update coordinates');
      }
      setEditModalOpen(false);
      setEditForm({ convoyId: '', startLat: '', startLng: '', endLat: '', endLng: '' });
      // Refresh convoys and keep selected convoy updated
      await fetchConvoys();
      // If the selected convoy was updated, update it in state
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
                  <th style={{ padding: '10px', color: '#22c55e' }}>Action</th>
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
                    <td style={{ padding: '10px', display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setSelectedConvoy(convoy)} style={{ background: selectedConvoy?._id === convoy._id ? '#22c55e' : '#166534', color: '#11251e', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>
                        {selectedConvoy?._id === convoy._id ? 'Selected' : 'Select'}
                      </button>
                      <button onClick={() => openEditModal(convoy)} style={{ background: '#fbbf24', color: '#11251e', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
                  {/* Normal markers for all other points */}
                  {(!selectedConvoy || selectedConvoy._id !== convoy._id) && convoy.route && convoy.route[0] && (
                    <Marker
                      key={convoy._id + '-start'}
                      position={[convoy.route[0].latitude, convoy.route[0].longitude]}
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
                  {/* Polyline for route */}
                  {convoy.route && convoy.route.length === 2 && (
                    <Polyline
                      key={convoy._id + '-polyline'}
                      positions={[
                        [convoy.route[0].latitude, convoy.route[0].longitude],
                        [convoy.route[1].latitude, convoy.route[1].longitude],
                      ]}
                      pathOptions={{ color: selectedConvoy?._id === convoy._id ? '#22c55e' : '#fbbf24', weight: 4, opacity: 0.7 }}
                    />
                  )}
                </>
              ))}
            </MapContainer>
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
      {/* Edit Coordinates Modal */}
      {editModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <form onSubmit={handleEditSubmit} style={{ background: '#1a2e25', padding: '2rem', borderRadius: '12px', minWidth: '340px', color: '#d1fae5', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 2px 16px #0008' }}>
            <h2 style={{ color: '#22c55e', marginBottom: '1rem' }}>Edit Convoy Coordinates</h2>
            <label>Start Latitude:
              <input name="startLat" value={editForm.startLat} onChange={handleEditFormChange} required type="number" step="any" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
            </label>
            <label>Start Longitude:
              <input name="startLng" value={editForm.startLng} onChange={handleEditFormChange} required type="number" step="any" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
            </label>
            <label>End Latitude:
              <input name="endLat" value={editForm.endLat} onChange={handleEditFormChange} required type="number" step="any" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
            </label>
            <label>End Longitude:
              <input name="endLng" value={editForm.endLng} onChange={handleEditFormChange} required type="number" step="any" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #14532d', marginTop: '4px' }} />
            </label>
            {editError && <div style={{ color: '#f87171', marginBottom: '0.5rem' }}>{editError}</div>}
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