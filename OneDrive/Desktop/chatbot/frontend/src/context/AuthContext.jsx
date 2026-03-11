import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Change this to match backend
export const API_URL = 'http://localhost:5000/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if user is already logged in
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.post(`${API_URL}/auth/login`, {
                email,
                password,
            });
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            setLoading(false);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            setLoading(false);
            return false;
        }
    };

    const signup = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.post(`${API_URL}/auth/signup`, {
                email,
                password,
            });
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
            setLoading(false);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed');
            setLoading(false);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};
