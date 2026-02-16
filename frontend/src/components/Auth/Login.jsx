import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert } from '@mui/material';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';

function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(email, password);
            toast.success('Login successful!');
            onLogin(response.data.user, response.data.token);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
            toast.error('Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom align="center">
                    Login
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        required
                    />

                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        margin="normal"
                        required
                    />

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        sx={{ mt: 3 }}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                </Box>

                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Test Accounts:
                    </Typography>
                    <Typography variant="caption" display="block">
                        Admin: admin@ecommerce.com / admin123
                    </Typography>
                    <Typography variant="caption" display="block">
                        User: user@example.com / user123
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}

export default Login;
