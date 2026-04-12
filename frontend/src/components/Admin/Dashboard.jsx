import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Grid, Paper, Typography, Button, Box, TextField, CircularProgress, Alert, Chip
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { adminAPI } from '../../services/api';
import { subscribeToBackupCreated } from '../../services/websocket';
import { toast } from 'react-toastify';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [canaryCount, setCanaryCount] = useState(50);
    const [deploying, setDeploying] = useState(false);
    const [backups, setBackups] = useState([]);
    const [creatingBackup, setCreatingBackup] = useState(false);
    const [restoringBackup, setRestoringBackup] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadStats();
        loadBackups();

        // Auto-refresh backup list when backend fires an auto-backup (attack / ransomware)
        const unsubscribe = subscribeToBackupCreated((data) => {
            const trigger = data.trigger === 'ransomware_intercept'
                ? '🛡️ Emergency backup secured BEFORE ransomware wipe!'
                : `🛡️ Auto-backup triggered (${data.trigger}): ${data.records} records secured.`;
            toast.info(trigger, { autoClose: 6000 });
            loadBackups(); // Refresh the list so the new card appears immediately
        });

        return () => unsubscribe();
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

    const loadBackups = async () => {
        try {
            const res = await adminAPI.listBackups();
            setBackups(res.data.backups || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleTakeSnapshot = async () => {
        try {
            setCreatingBackup(true);
            const res = await adminAPI.createBackup();
            toast.success(res.data.message);
            loadBackups();
        } catch (err) {
            toast.error('Failed to create snapshot');
        } finally {
            setCreatingBackup(false);
        }
    };

    const handleRestore = async (snapshotId) => {
        try {
            setRestoringBackup(snapshotId);
            const res = await adminAPI.restoreBackup(snapshotId);
            toast.success(res.data.message);
            loadStats();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to restore');
        } finally {
            setRestoringBackup(null);
        }
    };

    const handleDownloadSnapshot = async (snapshotId) => {
        try {
            const response = await adminAPI.downloadBackup(snapshotId);
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `${snapshotId}_raw_data.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            
            toast.success("Snapshot JSON downloaded successfully!");
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to download snapshot data');
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

                {/* Secure Offline Backup (Zero Trust) */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    Secure Offline Backup (Zero Trust)
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Create isolated, air-gapped snapshots to recover from ransomware/destructive attacks.
                                </Typography>
                            </Box>
                            <Button 
                                variant="contained" 
                                color="success"
                                onClick={handleTakeSnapshot}
                                disabled={creatingBackup}
                            >
                                {creatingBackup ? 'Creating...' : 'Take Snapshot'}
                            </Button>
                        </Box>

                        {backups.length === 0 ? (
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>No backups found.</Typography>
                        ) : (
                            <Grid container spacing={2}>
                                {backups.map(backup => (
                                    <Grid item xs={12} md={4} key={backup.id}>
                                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', border: '1px solid #ddd' }}>
                                            <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', color: '#333' }}>
                                                {backup.id}
                                            </Typography>
                                            <Typography variant="caption" display="block" sx={{ mb: 1, color: '#666' }}>
                                                {new Date(backup.timestamp).toLocaleString()}
                                            </Typography>
                                            {backup.source && (
                                                <Chip
                                                    label={backup.source === 's3' ? '☁️ S3' : backup.source === 'memory+s3' ? '☁️ S3 + Memory' : '💾 Memory'}
                                                    size="small"
                                                    color={backup.source.includes('s3') ? 'success' : 'default'}
                                                    sx={{ mb: 1 }}
                                                />
                                            )}
                                            <Button 
                                                size="small" 
                                                variant="contained" 
                                                color="primary"
                                                fullWidth
                                                onClick={() => handleRestore(backup.id)}
                                                disabled={restoringBackup === backup.id}
                                            >
                                                {restoringBackup === backup.id ? 'Restoring...' : 'Restore This Snapshot'}
                                            </Button>
                                            <Button 
                                                size="small" 
                                                variant="outlined" 
                                                color="info"
                                                fullWidth
                                                onClick={() => handleDownloadSnapshot(backup.id)}
                                                sx={{ mt: 1 }}
                                            >
                                                Download JSON
                                            </Button>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}

export default Dashboard;
