import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/Layout/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProductList from './components/Shop/ProductList';
import Cart from './components/Shop/Cart';
import AttackSimulator from './components/Shop/AttackSimulator';
import AttackerConsole from './components/Attacker/AttackerConsole';
import AdminDashboard from './components/Admin/Dashboard';
import AttackMonitor from './components/Admin/AttackMonitor';
import BlockchainViewer from './components/Admin/BlockchainViewer';

// Services
import { initWebSocket } from './services/websocket';
import { securityAPI } from './services/api';

const DEFAULT_SECURITY_STATE = {
    mode: 'NORMAL',
    safe_mode: false,
    message: 'Traffic normal'
};

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        error: {
            main: '#f44336',
        },
        warning: {
            main: '#ff9800',
        },
        success: {
            main: '#4caf50',
        }
    },
});

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [securityState, setSecurityState] = useState(DEFAULT_SECURITY_STATE);

    useEffect(() => {
        // Check for stored token
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            setUser(JSON.parse(userData));

            // Initialize WebSocket for admin users
            if (JSON.parse(userData).role === 'admin') {
                initWebSocket(token);
            }
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        let active = true;

        const loadSecurityState = async () => {
            try {
                const response = await securityAPI.getStatus();
                if (active) {
                    setSecurityState(response.data || DEFAULT_SECURITY_STATE);
                }
            } catch (error) {
                if (active) {
                    setSecurityState(DEFAULT_SECURITY_STATE);
                }
            }
        };

        loadSecurityState();
        const intervalId = window.setInterval(loadSecurityState, 5000);

        return () => {
            active = false;
            window.clearInterval(intervalId);
        };
    }, []);

    const handleLogin = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        // Initialize WebSocket for admin
        if (userData.role === 'admin') {
            initWebSocket(token);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Navbar user={user} onLogout={handleLogout} securityState={securityState} />

                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={
                        user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
                    } />

                    <Route path="/register" element={
                        user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />
                    } />

                    {/* Shop routes */}
                    <Route path="/" element={<ProductList securityState={securityState} />} />
                    <Route path="/cart" element={
                        user ? <Cart securityState={securityState} /> : <Navigate to="/login" />
                    } />
                    <Route path="/attack-simulator" element={
                        user ? <AttackSimulator /> : <Navigate to="/login" />
                    } />
                    <Route path="/attacker" element={
                        user?.role === 'attacker' ? <AttackerConsole /> : <Navigate to="/" />
                    } />

                    {/* Admin routes */}
                    <Route path="/admin" element={
                        user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />
                    } />

                    <Route path="/admin/attacks" element={
                        user?.role === 'admin' ? <AttackMonitor /> : <Navigate to="/" />
                    } />

                    <Route path="/admin/blockchain" element={
                        user?.role === 'admin' ? <BlockchainViewer /> : <Navigate to="/" />
                    } />
                </Routes>

                <ToastContainer position="bottom-right" />
            </Router>
        </ThemeProvider>
    );
}

export default App;
