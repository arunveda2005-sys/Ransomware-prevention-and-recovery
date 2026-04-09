import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Grid, Paper, Typography, Button, Box, TextField, CircularProgress, Alert
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
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

    const handleMitreReport = async () => {
        try {
            const response = await adminAPI.getMitreReport();

            // Format JSON and trigger download
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `MITRE_Security_Report_${timestamp}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            toast.success("MITRE Report Downloaded Successfully!");
        } catch (err) {
            toast.error('Failed to generate MITRE report');
        }
    };

    if (loading) {
        return (
            <Container sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    const hasMitreRecords = stats?.total_blocks > 0;

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Security Operations Center (SOC)
            </Typography>

            <Alert severity={stats?.security_state?.safe_mode ? 'error' : 'success'} sx={{ mb: 3 }}>
                <strong>{stats?.security_state?.mode || 'NORMAL'}</strong> {stats?.security_state?.message || 'Traffic normal'}
            </Alert>

            {/* SOC Statistics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            Active Monitored Users
                        </Typography>
                        <Typography variant="h3">
                            {stats?.users || 0}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            Active AI Sessions
                        </Typography>
                        <Typography variant="h3">
                            {stats?.active_sessions || 0}
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            Total Banned IPs
                        </Typography>
                        <Typography variant="h3" color="error">
                            {stats?.total_blocks || 0}
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

            {/* Visualizations */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            Real-time Traffic Analysis (12h)
                        </Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={stats?.traffic_data || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="requests" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            MITRE ATT&CK Groupings
                        </Typography>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={stats?.mitre_data || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#f44336" />
                            </BarChart>
                        </ResponsiveContainer>
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

            {/* Canary Deployment & Actions */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
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
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Quick SOC Actions
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Manage system compliance and monitor threats
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
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
                            <Button
                                variant="outlined"
                                color="info"
                                onClick={handleMitreReport}
                                disabled={!hasMitreRecords}
                            >
                                {hasMitreRecords ? 'Generate MITRE ATT&CK Report' : 'No Threat Records for MITRE'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}

export default Dashboard;
