import { useState } from 'react';
import './login.module.css';
import './header.css';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/users/login', { username, password });
            onLogin(res.data.user);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.user.role);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

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
            </header>
            <div className="header-spacer" />
            <div className="login-container">
                <form onSubmit={handleSubmit}>
                    <h2>OpsTrack Login</h2>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required />
                    <button type="submit">Login</button>
                    {error && <p className="error">{error}</p>}
                </form>
            </div>
            <div className="footer-spacer" />
            <footer className="app-footer">
                <p>&copy; {new Date().getFullYear()} OpsTrack. All access monitored.</p>
            </footer>
        </div>
    );
}

export default Login;
