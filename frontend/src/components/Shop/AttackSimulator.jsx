import { useState } from 'react';
import {
    Container, Paper, Typography, Button, Box, Grid,
    Card, CardContent, CardActions, Alert, LinearProgress,
    Chip, Divider
} from '@mui/material';
import {
    Security as SecurityIcon, BugReport as BugIcon,
    Speed as SpeedIcon, Search as SearchIcon,
    ShoppingCart as CartIcon, Lock as LockIcon,
    Warning as WarningIcon
} from '@mui/icons-material';

const AttackSimulator = () => {
    const [activeAttack, setActiveAttack] = useState(null);
    const [attackLog, setAttackLog] = useState([]);
    const [progress, setProgress] = useState(0);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setAttackLog(prev => [{
            time: timestamp,
            message,
            type
        }, ...prev].slice(0, 20));
    };

    const launchDDoS = async () => {
        setActiveAttack('ddos');
        setProgress(0);
        addLog('🔴 Starting DDoS attack...', 'warning');

        const totalRequests = 50;
        let successCount = 0;
        let blockedCount = 0;

        for (let i = 0; i < totalRequests; i++) {
            try {
                const response = await fetch('http://localhost:5000/api/products');
                if (response.ok) {
                    successCount++;
                    addLog(`✓ Request ${i + 1}/${totalRequests} succeeded`, 'success');
                } else if (response.status === 403) {
                    blockedCount++;
                    addLog(`✗ Request ${i + 1}/${totalRequests} BLOCKED`, 'error');
                }
            } catch (error) {
                blockedCount++;
                addLog(`✗ Request ${i + 1}/${totalRequests} ERROR`, 'error');
            }
            setProgress(((i + 1) / totalRequests) * 100);
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        addLog(`🏁 Attack complete: ${successCount} succeeded, ${blockedCount} blocked`, 'info');
        setActiveAttack(null);
        setProgress(0);
    };

    const launchEndpointScan = async () => {
        setActiveAttack('scanning');
        setProgress(0);
        addLog('🔴 Starting endpoint scanning...', 'warning');

        const token = localStorage.getItem('token');
        const endpoints = [
            '/api/products', '/api/cart', '/api/orders',
            '/api/admin/dashboard', '/api/admin/users/export',
            '/api/admin/blockchain', '/api/users'
        ];

        for (let i = 0; i < endpoints.length; i++) {
            try {
                const response = await fetch(`http://localhost:5000${endpoints[i]}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                if (response.ok) {
                    addLog(`✓ ${endpoints[i]}: ${response.status}`, 'success');
                } else if (response.status === 403) {
                    addLog(`🔒 ${endpoints[i]}: ${response.status}`, 'warning');
                }
            } catch (error) {
                addLog(`✗ ${endpoints[i]}: Error`, 'error');
            }
            setProgress(((i + 1) / endpoints.length) * 100);
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        addLog('🏁 Endpoint scan complete', 'info');
        setActiveAttack(null);
        setProgress(0);
    };

    const attacks = [
        {
            id: 'ddos',
            name: 'DDoS Simulation',
            description: 'Rapid requests to overwhelm the server',
            icon: <SpeedIcon />,
            color: '#f44336',
            action: launchDDoS
        },
        {
            id: 'scanning',
            name: 'Endpoint Scanning',
            description: 'Discover and probe API endpoints',
            icon: <SearchIcon />,
            color: '#9c27b0',
            action: launchEndpointScan
        }
    ];

    const getLogColor = (type) => {
        switch (type) {
            case 'success': return '#4caf50';
            case 'error': return '#f44336';
            case 'warning': return '#ff9800';
            default: return '#2196f3';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SecurityIcon sx={{ fontSize: 40, mr: 2, color: '#f44336' }} />
                    <Box>
                        <Typography variant="h4">Attack Simulator</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Test the defense system with realistic attack scenarios
                        </Typography>
                    </Box>
                </Box>

                <Alert severity="warning" sx={{ mb: 3 }}>
                    <strong>For Testing Only:</strong> Open the Admin Attack Monitor in another window to see real-time detection.
                </Alert>

                {activeAttack && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2">Attack in progress...</Typography>
                        <LinearProgress variant="determinate" value={progress} />
                    </Box>
                )}
            </Paper>

            <Grid container spacing={3}>
                {attacks.map((attack) => (
                    <Grid item xs={12} md={6} key={attack.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ bgcolor: attack.color, color: 'white', p: 1, borderRadius: 1, mr: 2 }}>
                                        {attack.icon}
                                    </Box>
                                    <Typography variant="h6">{attack.name}</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    {attack.description}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={attack.action}
                                    disabled={activeAttack !== null}
                                    sx={{ bgcolor: attack.color, '&:hover': { bgcolor: attack.color, opacity: 0.9 } }}
                                >
                                    {activeAttack === attack.id ? 'Running...' : 'Launch Attack'}
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {attackLog.length > 0 && (
                <Paper sx={{ p: 3, mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <WarningIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">Attack Log</Typography>
                        <Chip label={`${attackLog.length} events`} size="small" sx={{ ml: 2 }} />
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ maxHeight: 400, overflow: 'auto', bgcolor: '#1e1e1e', p: 2, borderRadius: 1, fontFamily: 'monospace' }}>
                        {attackLog.map((log, index) => (
                            <Box key={index} sx={{ color: getLogColor(log.type), fontSize: '0.875rem', mb: 0.5 }}>
                                [{log.time}] {log.message}
                            </Box>
                        ))}
                    </Box>
                </Paper>
            )}
        </Container>
    );
};

export default AttackSimulator;
