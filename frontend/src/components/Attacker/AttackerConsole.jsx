import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Container, Paper, Typography, Button, Box, Grid,
    Card, CardContent, CardActions, Alert, LinearProgress,
    Chip, Divider
} from '@mui/material';
import {
    Security as SecurityIcon, BugReport as BugIcon,
    Speed as SpeedIcon, Search as SearchIcon,
    ShoppingCart as ShoppingCartIcon, Lock as LockIcon,
    Warning as WarningIcon, CloudDownload as DownloadIcon,
    CloudDownload as ExfilIcon, // Alias for exfiltration attack
    VisibilityOff as StealthIcon
} from '@mui/icons-material';

const AttackerConsole = () => {
    const [activeAttack, setActiveAttack] = useState(null);
    const [attackLog, setAttackLog] = useState([]);
    const [progress, setProgress] = useState(0);
    const [ipStatus, setIpStatus] = useState('Active');
    const [currentIP, setCurrentIP] = useState('Loading...');

    useEffect(() => {
        // Generate OR Retrieve a random "Attacker IP" for this session
        // This ensures identity persists even if we navigate away
        let randomIp = localStorage.getItem('mockIp');
        if (!randomIp) {
            randomIp = `192.168.1.${Math.floor(Math.random() * 200) + 10}`;
            localStorage.setItem('mockIp', randomIp);
        }

        setCurrentIP(randomIp);
        checkIpStatus(randomIp);
    }, []);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setAttackLog(prev => [{
            time: timestamp,
            message,
            type
        }, ...prev].slice(0, 50));
    };

    const checkIpStatus = async (ipToCheck = currentIP) => {
        try {
            // Check status with the mock IP
            const response = await api.get('/products', {
                headers: { 'X-Mock-IP': ipToCheck }
            });

            if (response.status === 403) {
                setIpStatus('Blocked');
                addLog('⚠️ IP Address is BLOCKED by server', 'error');
            } else {
                setIpStatus('Active');
            }
        } catch (error) {
            if (error.response && error.response.status === 403) {
                setIpStatus('Blocked');
                addLog('⚠️ IP Address is BLOCKED by server', 'error');
            } else {
                setIpStatus('Error');
            }
        }
    };

    const [stolenData, setStolenData] = useState([]);

    const runAttack = async (type, config) => {
        setActiveAttack(type);
        setProgress(0);
        addLog(`🔴 Starting ${config.name}...`, 'warning');

        let successCount = 0;
        let blockedCount = 0;

        for (let i = 0; i < config.count; i++) {
            if (ipStatus === 'Blocked') {
                addLog(`⛔ Attack aborted: IP is Blocked`, 'error');
                break;
            }

            try {
                // Build request with mock IP header
                const requestConfig = {
                    method: config.options.method || 'GET',
                    headers: {
                        ...config.options.headers,
                        'X-Mock-IP': currentIP
                    }
                };

                // Use api service which handles auth automatically
                const response = await api.request({
                    url: config.endpoint,
                    ...requestConfig
                });

                // Success
                successCount++;
                addLog(`✓ ${config.name} Request ${i + 1} succeeded`, 'success');

                // Special case for exfiltration
                if (type === 'exfiltration' && response.data) {
                    const users = response.data.users || [];
                    setStolenData(users);
                    addLog(`🔓 EXFILTRATED DATA: ${users.length} user records stolen!`, 'error');
                    addLog(`💡 TIP: Notice the 'api_key' fields in the stolen data - these are trackable honeytokens!`, 'info');
                    if (response.data.canary_alert && response.data.canary_alert.breach_detected) {
                        addLog(`🚨 SYSTEM B TRIGGERED: ${response.data.canary_alert.message}`, 'warning');
                    }
                }

            } catch (error) {
                if (error.response && error.response.status === 403) {
                    blockedCount++;
                    setIpStatus('Blocked');
                    addLog(`✗ Request ${i + 1} BLOCKED - Defense Triggered`, 'error');
                } else {
                    addLog(`Request Error: ${error.message}`, 'error');
                }
            }

            setProgress(((i + 1) / config.count) * 100);
            await new Promise(resolve => setTimeout(resolve, config.delay));
        }

        addLog(`🏁 ${config.name} complete. Success: ${successCount}, Blocked: ${blockedCount}`, 'info');
        setActiveAttack(null);
        setProgress(0);
        checkIpStatus(); // Re-check status after attack
    };

    const attacks = [
        {
            id: 'normal',
            name: 'Normal Browsing',
            description: 'Simulate legitimate user traffic (low rate)',
            icon: <ShoppingCartIcon />,
            color: '#4caf50',
            action: () => runAttack('normal', {
                name: 'Normal Browsing',
                endpoint: '/products',
                count: 10,
                delay: 1000,
                options: { method: 'GET' }
            })
        },
        {
            id: 'rapid',
            name: 'Rapid Scraping (DDoS)',
            description: 'High-speed requests to trigger rate limiting/ML',
            icon: <SpeedIcon />,
            color: '#ff9800',
            action: () => runAttack('rapid', {
                name: 'Rapid Scraping',
                endpoint: '/products',
                count: 50,
                delay: 100,
                options: { method: 'GET' }
            })
        },
        {
            id: 'stealth',
            name: 'Slow Stealth Scraping',
            description: 'Low-and-slow attack to evade rate limits',
            icon: <StealthIcon />,
            color: '#9c27b0',
            action: () => runAttack('stealth', {
                name: 'Stealth Scrape',
                endpoint: '/products',
                count: 20,
                delay: 2000,
                options: { method: 'GET' }
            })
        },
        {
            id: 'exfiltration',
            name: 'Data Exfiltration (Canary Test)',
            description: 'Trigger System B by accessing protected data',
            icon: <ExfilIcon />,
            color: '#e91e63',
            action: () => runAttack('exfiltration', {
                name: 'Data Exfiltration',
                endpoint: '/admin/users/export',
                count: 1,
                delay: 0,
                options: {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }
            })
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
            <Paper sx={{ p: 3, mb: 3, bgcolor: '#1a1a1a', color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BugIcon sx={{ fontSize: 40, mr: 2, color: '#f44336' }} />
                        <Box>
                            <Typography variant="h4" sx={{ fontFamily: 'monospace' }}>ATTACK SIMULATION CONSOLE</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                Authorized Security Testing Environment
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="overline" display="block">Target Connection</Typography>
                        <Chip
                            label={ipStatus === 'Active' ? 'CONNECTED' : 'ACCESS DENIED'}
                            color={ipStatus === 'Active' ? 'success' : 'error'}
                            icon={ipStatus === 'Active' ? <LinkIcon /> : <LockIcon />}
                        />
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            IP: {currentIP}
                        </Typography>
                    </Box>
                </Box>

                {ipStatus === 'Blocked' && (
                    <Alert severity="error" variant="filled" sx={{ mb: 3 }}>
                        <strong>ACCESS DENIED:</strong> Your IP address has been flagged and blocked by the defense system (System A).
                    </Alert>
                )}

                {activeAttack && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>EXECUTING: {activeAttack.toUpperCase()}...</Typography>
                        <LinearProgress variant="determinate" value={progress} color="error" />
                    </Box>
                )}
            </Paper>

            <Grid container spacing={3}>
                {attacks.map((attack) => (
                    <Grid item xs={12} md={6} lg={3} key={attack.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#2d2d2d', color: 'white' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ bgcolor: attack.color, color: 'white', p: 1, borderRadius: 1, mr: 2 }}>
                                        {attack.icon}
                                    </Box>
                                    <Typography variant="subtitle1" fontWeight="bold">{attack.name}</Typography>
                                </Box>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                    {attack.description}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ p: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={attack.action}
                                    disabled={activeAttack !== null || (ipStatus === 'Blocked' && attack.id !== 'normal')}
                                    sx={{
                                        bgcolor: attack.color,
                                        fontWeight: 'bold',
                                        '&:hover': { bgcolor: attack.color, opacity: 0.8 }
                                    }}
                                >
                                    {activeAttack === attack.id ? 'EXECUTING...' : 'INITIATE'}
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* STOLEN DATA PREVIEW SECTION */}
            {stolenData.length > 0 && (
                <Paper sx={{ p: 3, mt: 3, bgcolor: '#0a0a0a', color: '#fff', border: '1px solid #f44336' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <DownloadIcon sx={{ color: '#f44336', mr: 1 }} />
                        <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>STOLEN_DATA_DUMP.JSON</Typography>
                    </Box>
                    <Divider sx={{ mb: 2, borderColor: '#333' }} />
                    <Box sx={{
                        maxHeight: 400,
                        overflow: 'auto',
                        bgcolor: '#000',
                        p: 2,
                        borderRadius: 1,
                        border: '1px solid #222'
                    }}>
                        <pre style={{ margin: 0, color: '#0f0', fontSize: '0.85rem' }}>
                            {JSON.stringify(stolenData.slice(0, 10), null, 2)}
                            {stolenData.length > 10 && `\n... ${stolenData.length - 10} more records truncated ...`}
                        </pre>
                    </Box>
                    <Typography variant="caption" sx={{ mt: 2, display: 'block', color: '#f44336' }}>
                        ⚠️ Forensic markers detected in downloaded payload.
                    </Typography>
                </Paper>
            )}

            <Paper sx={{ p: 3, mt: 3, bgcolor: '#000', color: '#0f0', border: '1px solid #333' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>{'>'} CONSOLE_LOG</Typography>
                </Box>
                <Divider sx={{ mb: 2, borderColor: '#333' }} />
                <Box sx={{ maxHeight: 300, overflow: 'auto', fontFamily: 'monospace' }}>
                    {attackLog.length === 0 && <Typography sx={{ opacity: 0.5 }}>Ready for commands...</Typography>}
                    {attackLog.map((log, index) => (
                        <Box key={index} sx={{ color: getLogColor(log.type), fontSize: '0.9rem', mb: 0.5 }}>
                            <span style={{ opacity: 0.5 }}>[{log.time}]</span> {log.message}
                        </Box>
                    ))}
                </Box>
            </Paper>
        </Container>
    );
};

// Helper for icon
function LinkIcon() {
    return (
        <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24">
            <path fill="currentColor" d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z" />
        </svg>
    );
}

export default AttackerConsole;
