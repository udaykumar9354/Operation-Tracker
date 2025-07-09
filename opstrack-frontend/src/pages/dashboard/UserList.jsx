import { useEffect, useState } from 'react';

function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchUsers() {
            setLoading(true);
            setError("");
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const res = await fetch('http://localhost:8080/api/users/all-users', { headers });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setUsers(data);
                } else {
                    setUsers([]);
                    setError(data.message || 'No users found');
                }
            } catch (err) {
                setError('Failed to fetch users');
                setUsers([]);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, []);

    return (
        <div style={{ padding: '2rem', color: '#d1fae5', background: '#11251e', minHeight: '100vh' }}>
            <h1 style={{ color: '#22c55e', marginBottom: '2rem' }}>All Users</h1>
            {loading ? (
                <div>Loading...</div>
            ) : error ? (
                <div style={{ color: '#f87171' }}>{error}</div>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1a2e25' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #14532d' }}>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Name</th>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Email</th>
                            <th style={{ padding: '10px', color: '#22c55e' }}>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id} style={{ borderBottom: '1px solid #14532d' }}>
                                <td style={{ padding: '10px' }}>{user.name}</td>
                                <td style={{ padding: '10px' }}>{user.email}</td>
                                <td style={{ padding: '10px' }}>{user.role}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default UserList; 