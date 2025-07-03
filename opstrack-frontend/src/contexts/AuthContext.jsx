import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if (token && role) {
            setUser({ role, username: localStorage.getItem('username') || '', 
                     token });
        }
    }, []);

    const login = (userData) => 
    {
        localStorage.setItem('token', userData.token);
        localStorage.setItem('role', userData.role);
        setUser({ role: userData.role });
    }

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
