import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Grid, Paper, Typography, Button, Box, TextField, CircularProgress
} from '@mui/material';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [canaryCount, setCanaryCount] = useState(50);
    const [deploying, setDeploying] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await adminAPI.getDashboard();
            setStats(response.data);
        } catch (err) {
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleDeployCanaries = async () => {
        setDeploying(true);
        try {
            const response = await adminAPI.deployCanaries(canaryCount);
            toast.success(response.data.message);
            loadStats();
        } catch (err) {
            toast.error('Failed to deploy canaries');
        } finally {
            setDeploying(false);
        }
    };

    const handleExportUsers = async () => {
        try {
            const response = await adminAPI.exportUsers();

            if (response.data.canary_alert?.breach_detected) {
                toast.error('🚨 BREACH DETECTED - Canary accessed!');
            } else {
                toast.success(`Exported ${response.data.total} users`);
            }
        } catch (err) {
            toast.error('Failed to export users');
        }
    };

    if (loading) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Admin Dashboard
            </Typography>

            {/* Statistics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            Users
                        </Typography>
                        <Typography variant="h3">
                            {stats?.users || 0}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            Products
                        </Typography>
                        <Typography variant="h3">
                            {stats?.products || 0}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            Orders
                        </Typography>
                        <Typography variant="h3">
                            {stats?.orders || 0}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Paper
                        sx={{
                            p: 3,
                            textAlign: 'center',
                            bgcolor: '#f44336',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.02)', boxShadow: 6 }
                        }}
                        onClick={() => navigate('/admin/attacks')}
                    >
                        <Typography variant="h6">
                            Threats (24h)
                        </Typography>
                        <Typography variant="h3">
                            {stats?.threats_24h || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.9 }}>
                            Click for Live Monitor
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Blockchain Stats */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Blockchain Audit Trail
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">
                            Total Blocks: <strong>{stats?.blockchain?.total_blocks || 0}</strong>
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="text.secondary">
                            Total Events: <strong>{stats?.blockchain?.total_events || 0}</strong>
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="body2" color={stats?.blockchain?.is_valid ? 'success.main' : 'error.main'}>
                            Chain Valid: <strong>{stats?.blockchain?.is_valid ? 'YES' : 'NO'}</strong>
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Canary Deployment */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Deploy Smart Canaries
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Generate ML-based honeypot records to detect data breaches
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <TextField
                        type="number"
                        label="Number of Canaries"
                        value={canaryCount}
                        onChange={(e) => setCanaryCount(parseInt(e.target.value))}
                        sx={{ width: 200 }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleDeployCanaries}
                        disabled={deploying}
                    >
                        {deploying ? 'Deploying...' : 'Deploy Canaries'}
                    </Button>
                </Box>
            </Paper>

            {/* Quick Actions */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Quick Actions
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Manage system and monitor threats
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => navigate('/admin/attacks')}
                    >
                        View Live Attacks
                    </Button>
                    <Button
                        variant="outlined"
                        color="warning"
                        onClick={handleExportUsers}
                    >
                        Export Users (Monitored)
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}

export default Dashboard;
