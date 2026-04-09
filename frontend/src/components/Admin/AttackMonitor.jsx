import React, { useState, useEffect } from 'react';
import {
    Container, Grid, Paper, Typography, Box, Chip, Alert, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Divider, Card, CardContent, Tabs, Tab, Stack, LinearProgress
} from '@mui/material';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    Shield as ShieldIcon,
    GppGood as ValidationIcon,
    Block as BlockIcon,
    Warning as WarningIcon,
    Storage as DatabaseIcon,
    Link as BlockchainIcon,
    Speed as SpeedIcon,
    Recommend as AiIcon,
    Search as SearchIcon,
    History as HistoryIcon,
    BugReport as BugIcon
} from '@mui/icons-material';
import { subscribeToThreats, subscribeToCanaries, subscribeToHoneytokens, subscribeToSecurityState, subscribeToBlockedIps } from '../../services/websocket';
import { adminAPI, securityAPI } from '../../services/api';

// --- THEME CONSTANTS ---
const THEME = {
    bg: '#0a1929', // Deep dark blue
    panelBg: '#0f2744', // Lighter dark blue
    primary: '#00e5ff', // Neon Cyan
    secondary: '#7c4dff', // Neon Purple
    success: '#00c853', // Neon Green
    warning: '#ffab00', // Neon Orange
    error: '#ff1744', // Neon Red
    text: '#e0e0e0',
    textDim: '#78909c',
    border: '1px solid rgba(144, 202, 249, 0.2)'
};

function AttackMonitor() {
    // --- STATE ---
    const [currentTab, setCurrentTab] = useState(0);
    const [threats, setThreats] = useState([]);
    const [statistics, setStatistics] = useState({ total: 0, blocks: 0, shadowBanned: 0, monitored: 0 });
    const [canaryAlert, setCanaryAlert] = useState(null);
    const [systemMode, setSystemMode] = useState('NORMAL');
    const [securityMessage, setSecurityMessage] = useState('Traffic normal');
    const [blockedIps, setBlockedIps] = useState([]);
    const [blockchainCount, setBlockchainCount] = useState(0);

    // --- EFFECT: DATA LOADING & WEBSOCKETS ---
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Threats
                const response = await adminAPI.getLiveThreats();
                const recentThreats = response.data.threats || response.data;
                setThreats(recentThreats);

                // Stats
                const initialStats = recentThreats.reduce((acc, t) => ({
                    total: acc.total,
                    blocks: acc.blocks + (t.action === 'block' ? 1 : 0),
                    shadowBanned: acc.shadowBanned + (t.action === 'shadow_ban' ? 1 : 0),
                    monitored: acc.monitored + (t.action === 'monitor' ? 1 : 0)
                }), { total: response.data.total || recentThreats.length, blocks: 0, shadowBanned: 0, monitored: 0 });
                setStatistics(initialStats);

                // Blocked IPs
                const ipResponse = await adminAPI.getBannedIPs();
                const blockedList = (ipResponse.data.records || []).map(record => ({
                    ip: record.ip,
                    timestamp: record.blocked_at || new Date().toISOString(),
                    score: record.risk_score ? (record.risk_score * 100).toFixed(0) : '100',
                    status: record.source || 'banned',
                    reason: record.reason
                }));
                setBlockedIps(blockedList);
                if (blockedList.length > 0) setSystemMode('UNDER_ATTACK');

                const securityResponse = await securityAPI.getStatus();
                setSystemMode(securityResponse.data?.mode || 'NORMAL');
                setSecurityMessage(securityResponse.data?.message || 'Traffic normal');

                // Blockchain
                const bcResponse = await adminAPI.getBlockchain();
                if (bcResponse.data && bcResponse.data.blockchain) {
                    setBlockchainCount(bcResponse.data.blockchain.length);
                }

            } catch (e) { console.error("Data Load Error:", e); }
        };
        loadInitialData();

        // WS: Threats
        const unsubscribeThreats = subscribeToThreats((threat) => {
            setThreats(prev => [threat, ...prev].slice(0, 100));
            setStatistics(prev => ({
                ...prev,
                total: prev.total + 1,
                blocks: prev.blocks + (threat.action === 'block' ? 1 : 0),
                shadowBanned: prev.shadowBanned + (threat.action === 'shadow_ban' ? 1 : 0),
                monitored: prev.monitored + (threat.action === 'monitor' ? 1 : 0)
            }));

            if (threat.action === 'block') {
                setSystemMode('UNDER_ATTACK');
                setSecurityMessage(`Attack contained from ${threat.ip || 'unknown IP'}`);
                setBlockedIps(prev => {
                    const ip = threat.ip || 'Unknown';
                    if (!prev.find(p => p.ip === ip)) {
                        return [{ ip, timestamp: threat.timestamp, score: (threat.risk_score * 100).toFixed(0), status: 'system_a', reason: threat.reasoning }, ...prev];
                    }
                    return prev;
                });
            }
        });

        // WS: Canaries
        const unsubscribeCanaries = subscribeToCanaries((alert) => {
            setCanaryAlert(prev => ({
                ...alert,
                type: 'CANARY'
            }));
            setSystemMode('BREACH_CONFIRMED');
            setSecurityMessage('Safe mode active after canary-confirmed exfiltration');
            setBlockchainCount(c => c + 1);
        });

        // WS: Honeytokens (System B Secondary Alert)
        const unsubscribeHoneytokens = subscribeToHoneytokens((alert) => {
            setCanaryAlert(prev => ({
                ...alert,
                type: 'HONEYTOKEN'
            }));
            setSystemMode('BREACH_CONFIRMED');
            setSecurityMessage('Safe mode active after honeytoken trigger');
            setBlockchainCount(c => c + 1);
        });

        const unsubscribeSecurityState = subscribeToSecurityState((state) => {
            setSystemMode(state.mode || 'NORMAL');
            setSecurityMessage(state.message || 'Traffic normal');
        });

        const unsubscribeBlockedIps = subscribeToBlockedIps((event) => {
            setBlockedIps(prev => {
                if (prev.some(item => item.ip === event.ip)) {
                    return prev;
                }

                return [{
                    ip: event.ip,
                    timestamp: event.timestamp,
                    score: event.risk_score ? (event.risk_score * 100).toFixed(0) : '100',
                    status: event.source || 'blocked',
                    reason: event.reason
                }, ...prev];
            });
        });

        return () => {
            unsubscribeThreats();
            unsubscribeCanaries();
            unsubscribeHoneytokens();
            unsubscribeSecurityState();
            unsubscribeBlockedIps();
        };
    }, []);

    const handleUnbanIP = async (ip) => {
        await adminAPI.unbanIP(ip);
        setBlockedIps(p => p.filter(i => i.ip !== ip));
        if (blockedIps.length <= 1 && systemMode === 'UNDER_ATTACK') {
            setSystemMode('NORMAL');
            setSecurityMessage('Traffic normal');
        }
    };

    const handleClearLogs = async () => {
        if (window.confirm('Reset System A & B?')) {
            await adminAPI.clearThreats();
            window.location.reload();
        }
    };

    // --- RENDER HELPERS ---
    const StatusBadge = ({ count, label, color }) => (
        <Box sx={{ textAlign: 'center', p: 2, bgcolor: THEME.panelBg, border: THEME.border, borderRadius: 2 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: color }}>{count}</Typography>
            <Typography variant="caption" sx={{ color: THEME.textDim, textTransform: 'uppercase' }}>{label}</Typography>
        </Box>
    );

    const ThreatRow = ({ t }) => {
        const color = t.action === 'block' ? THEME.error : t.action === 'shadow_ban' ? THEME.warning : THEME.success;
        return (
            <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell sx={{ color: THEME.textDim, borderBottom: '1px solid #1e3a5a' }}>
                    {t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : 'Recent'}
                </TableCell>
                <TableCell sx={{ color: THEME.text, borderBottom: '1px solid #1e3a5a', fontFamily: 'monospace' }}>
                    {t.ip || 'Unknown'}
                </TableCell>
                <TableCell sx={{ color: THEME.text, borderBottom: '1px solid #1e3a5a' }}>
                    {t.path || '/'}
                </TableCell>
                <TableCell sx={{ color: color, fontWeight: 'bold', borderBottom: '1px solid #1e3a5a' }}>
                    {t.action.toUpperCase()}
                </TableCell>
                <TableCell sx={{ color: THEME.textDim, borderBottom: '1px solid #1e3a5a' }}>
                    {Math.round((t.risk_score || 0) * 100)}%
                </TableCell>
            </TableRow>
        );
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, minHeight: '85vh', borderRadius: 4 }}>

            {/* HEADER */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: THEME.text }}>
                        🛡️ SECURITY OPERATIONS CENTER
                    </Typography>
                    <Typography variant="body2" sx={{ color: THEME.textDim }}>
                        Integrated Defense Platform (IDP) v2.0
                    </Typography>
                </Box>
                <Button variant="outlined" color="error" size="small" onClick={handleClearLogs} startIcon={<HistoryIcon />}>
                    RESET SYSTEM
                </Button>
            </Box>

            <Alert severity={systemMode === 'BREACH_CONFIRMED' ? 'error' : systemMode === 'UNDER_ATTACK' ? 'warning' : 'success'} sx={{ mb: 3 }}>
                <strong>{systemMode}</strong> {securityMessage}
            </Alert>

            {/* TABS */}
            <Paper sx={{ mb: 3, bgcolor: THEME.panelBg, border: THEME.border }}>
                <Tabs
                    value={currentTab}
                    onChange={(e, v) => setCurrentTab(v)}
                    centered
                    TabIndicatorProps={{ sx: { bgcolor: THEME.primary, height: 3 } }}
                    sx={{
                        '& .MuiTab-root': { fontSize: '1rem', fontWeight: 'bold', color: THEME.textDim },
                        '& .Mui-selected': { color: `${THEME.primary} !important` }
                    }}
                >
                    <Tab icon={<ShieldIcon />} label="PREVENTION" iconPosition="start" />
                    <Tab icon={<SearchIcon />} label="DETECTION" iconPosition="start" />
                </Tabs>
            </Paper>

            {/* === TAB 0: PREVENTION (SYSTEM A) === */}
            {currentTab === 0 && (
                <Grid container spacing={3}>
                    {/* STATS ROW */}
                    <Grid item xs={12}>
                        <Grid container spacing={2}>
                            <Grid item xs={3}><StatusBadge count={statistics.total} label="Requests Scanned" color={THEME.primary} /></Grid>
                            <Grid item xs={3}><StatusBadge count={statistics.blocks} label="Auto-Blocked" color={THEME.error} /></Grid>
                            <Grid item xs={3}><StatusBadge count={statistics.shadowBanned} label="Shadow Banned" color={THEME.warning} /></Grid>
                            <Grid item xs={3}><StatusBadge count={statistics.monitored} label="Monitored" color={THEME.success} /></Grid>
                        </Grid>
                    </Grid>

                    {/* UPPER ROW: ML VISUALIZATIONS */}
                    {/* 1. Real-time Risk Index (Line Chart) */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 2, bgcolor: THEME.panelBg, border: THEME.border, height: 350 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <AiIcon sx={{ color: THEME.primary, mr: 1 }} />
                                <Typography variant="h6" sx={{ color: THEME.text }}>Real-time Risk Index</Typography>
                            </Box>
                            <ResponsiveContainer width="100%" height="85%">
                                <LineChart data={threats.slice(0, 20).reverse()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="timestamp" tick={false} />
                                    <YAxis domain={[0, 1]} tick={{ fill: THEME.textDim }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                        labelStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="risk_score"
                                        stroke={THEME.error}
                                        strokeWidth={2}
                                        dot={false}
                                        name="Risk Score"
                                        animationDuration={500}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="confidence"
                                        stroke={THEME.primary}
                                        strokeWidth={2}
                                        dot={false}
                                        name="AI Confidence"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* 2. Model Confidence (Bar Chart) - Last Detected Threat */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, bgcolor: THEME.panelBg, border: THEME.border, height: 350 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <SpeedIcon sx={{ color: THEME.secondary, mr: 1 }} />
                                <Typography variant="h6" sx={{ color: THEME.text }}>ML Model Consensus</Typography>
                            </Box>
                            {threats.length > 0 && threats[0].model_votes ? (
                                <Box sx={{ height: '85%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Typography variant="caption" sx={{ color: THEME.textDim, mb: 1 }}>
                                        Latest Analysis ({threats[0].ip})
                                    </Typography>
                                    {Object.entries(threats[0].model_votes || {}).map(([model, vote], i) => (
                                        <Box key={i} sx={{ mb: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption" sx={{ color: THEME.text }}>{model}</Typography>
                                                <Typography variant="caption" sx={{ color: vote > 0 ? THEME.error : THEME.success }}>
                                                    {vote > 0 ? 'MALICIOUS' : 'BENIGN'}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={100}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    bgcolor: 'rgba(255,255,255,0.1)',
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: vote > 0 ? THEME.error : THEME.success
                                                    }
                                                }}
                                            />
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: THEME.textDim }}>
                                    Waiting for analysis...
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* REPUTATION (Active Blocks Timeline) */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 0, bgcolor: THEME.panelBg, border: THEME.border, height: 400, overflow: 'hidden' }}>
                            <Box sx={{ p: 2, borderBottom: THEME.border, display: 'flex', alignItems: 'center' }}>
                                <BlockIcon sx={{ color: THEME.warning, mr: 1 }} />
                                <Typography variant="h6" sx={{ color: THEME.text }}>Active Block Timeline</Typography>
                            </Box>
                            <Box sx={{ p: 2 }}>
                                <Typography variant="caption" sx={{ color: THEME.textDim, display: 'block', mb: 2 }}>
                                    Real-time timeline of automatically blocked IPs.
                                </Typography>
                                <TableContainer sx={{ maxHeight: 300 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ color: THEME.textDim, borderBottom: THEME.border }}>TIMESTAMP</TableCell>
                                                <TableCell sx={{ color: THEME.textDim, borderBottom: THEME.border }}>IP ADDRESS</TableCell>
                                                <TableCell sx={{ color: THEME.textDim, borderBottom: THEME.border }}>ML SCORE</TableCell>
                                                <TableCell sx={{ color: THEME.textDim, borderBottom: THEME.border }}>STATUS</TableCell>
                                                <TableCell sx={{ color: THEME.textDim, borderBottom: THEME.border }}>ACTION</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {blockedIps.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ color: THEME.textDim, border: 0, py: 4 }}>
                                                        No active blocks
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                blockedIps.map((b, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell sx={{ color: THEME.textDim, borderBottom: '1px solid #1e3a5a' }}>
                                                            {new Date(b.timestamp).toLocaleTimeString()}
                                                        </TableCell>
                                                        <TableCell sx={{ color: THEME.text, borderBottom: '1px solid #1e3a5a', fontFamily: 'monospace' }}>{b.ip}</TableCell>
                                                        <TableCell sx={{ color: THEME.error, borderBottom: '1px solid #1e3a5a' }}>{b.score || '15.00'}</TableCell>
                                                        <TableCell sx={{ color: THEME.textDim, borderBottom: '1px solid #1e3a5a' }}>{b.status}</TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #1e3a5a' }}>
                                                            <Button size="small" variant="outlined" color="info" onClick={() => handleUnbanIP(b.ip)}>Unban</Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* LIVE THREAT DETECTION LOG */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 0, bgcolor: THEME.panelBg, border: THEME.border, height: 400, overflow: 'hidden' }}>
                            <Box sx={{ p: 2, borderBottom: THEME.border, display: 'flex', alignItems: 'center' }}>
                                <ShieldIcon sx={{ color: THEME.error, mr: 1 }} />
                                <Typography variant="h6" sx={{ color: THEME.text }}>Live Threat Detection (System A)</Typography>
                            </Box>
                            <Box sx={{ p: 2 }}>
                                <Typography variant="caption" sx={{ color: THEME.textDim, display: 'block', mb: 2 }}>
                                    Real-time ML threat analysis. Threats above threshold are automatically blocked.
                                </Typography>
                                <TableContainer sx={{ maxHeight: 300 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ color: THEME.textDim, borderBottom: THEME.border }}>TIME</TableCell>
                                                <TableCell sx={{ color: THEME.textDim, borderBottom: THEME.border }}>IP</TableCell>
                                                <TableCell sx={{ color: THEME.textDim, borderBottom: THEME.border }}>PATH</TableCell>
                                                <TableCell sx={{ color: THEME.textDim, borderBottom: THEME.border }}>DECISION</TableCell>
                                                <TableCell sx={{ color: THEME.textDim, borderBottom: THEME.border }}>CONF</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {threats.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ color: THEME.textDim, border: 0, py: 4 }}>
                                                        No threats detected yet
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                threats.slice(0, 20).map((t, i) => <ThreatRow key={i} t={t} />)
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* === TAB 1: DETECTION (SYSTEM B + LOGS) === */}
            {currentTab === 1 && (
                <Grid container spacing={3}>
                    {/* EVENT LOG (Live Feed) - MOVED HERE */}
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 0, bgcolor: THEME.panelBg, border: THEME.border, height: '100%', overflow: 'hidden' }}>
                            <Box sx={{ p: 2, borderBottom: THEME.border, display: 'flex', alignItems: 'center' }}>
                                <SpeedIcon sx={{ color: THEME.primary, mr: 1 }} />
                                <Typography variant="h6" sx={{ color: THEME.text }}>Live Threat Detection Log</Typography>
                            </Box>
                            <TableContainer sx={{ maxHeight: 600 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ bgcolor: THEME.panelBg, color: THEME.textDim, borderBottom: THEME.border }}>TIME</TableCell>
                                            <TableCell sx={{ bgcolor: THEME.panelBg, color: THEME.textDim, borderBottom: THEME.border }}>IP ADDRESS</TableCell>
                                            <TableCell sx={{ bgcolor: THEME.panelBg, color: THEME.textDim, borderBottom: THEME.border }}>PATH</TableCell>
                                            <TableCell sx={{ bgcolor: THEME.panelBg, color: THEME.textDim, borderBottom: THEME.border }}>DECISION</TableCell>
                                            <TableCell sx={{ bgcolor: THEME.panelBg, color: THEME.textDim, borderBottom: THEME.border }}>CONF</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {threats.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ color: THEME.textDim, border: 0, py: 4 }}>
                                                    No threats detected yet
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            threats.map((t, i) => <ThreatRow key={i} t={t} />)
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>

                    {/* RIGHT COLUMN: CANARIES + BLOCKCHAIN */}
                    <Grid item xs={12} md={5}>
                        <Stack spacing={3} sx={{ height: '100%' }}>
                            {/* CANARY STATUS */}
                            <Paper sx={{ p: 0, bgcolor: THEME.panelBg, border: THEME.border, flex: 1 }}>
                                <Box sx={{ p: 2, borderBottom: THEME.border, display: 'flex', alignItems: 'center' }}>
                                    <DatabaseIcon sx={{ color: THEME.warning, mr: 1 }} />
                                    <Typography variant="h6" sx={{ color: THEME.text }}>Smart Canary Tokens</Typography>
                                </Box>
                                <Box sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="body2" sx={{ color: THEME.textDim }}>Status</Typography>
                                        <Chip
                                            label={systemMode === 'BREACH_CONFIRMED' ? "BREACH DETECTED" : "ARMED"}
                                            color={systemMode === 'BREACH_CONFIRMED' ? "error" : "success"}
                                            variant="outlined"
                                        />
                                    </Box>
                                    <Typography variant="body2" sx={{ color: THEME.textDim, mb: 3 }}>
                                        50 Active Canary Tokens deployed.
                                    </Typography>

                                    {systemMode === 'BREACH_CONFIRMED' ? (
                                        <Alert severity="error" variant="filled" sx={{ bgcolor: 'rgba(255, 23, 68, 0.1)', border: '1px solid #ff1744', color: '#ff1744' }}>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {canaryAlert?.type === 'HONEYTOKEN' ? '🍯 HONEYTOKEN TAMPERED' : '🚨 DATA EXFILTRATION'}
                                            </Typography>
                                            <Box sx={{ maxHeight: 100, overflow: 'auto', bgcolor: 'rgba(0,0,0,0.3)', p: 1, borderRadius: 1, mt: 1 }}>
                                                <code style={{ fontSize: '0.8rem' }}>
                                                    {canaryAlert?.type === 'HONEYTOKEN'
                                                        ? `Token used by: ${canaryAlert?.usage_context?.attacker_ip || 'Unknown'}`
                                                        : (canaryAlert?.canaries_accessed || []).map(c => c.email || c.canary_id).join(', ') || 'Processing context...'
                                                    }
                                                </code>
                                            </Box>
                                        </Alert>
                                    ) : (
                                        <Box sx={{ p: 2, textAlign: 'center', border: `1px dashed ${THEME.textDim}`, borderRadius: 2, opacity: 0.5 }}>
                                            <ValidationIcon sx={{ fontSize: 40, color: THEME.success }} />
                                            <Typography variant="caption" display="block">Integrity Verified</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>

                            {/* BREACH COUNTERMEASURES (The "Poisoning" Evidence) */}
                            <Paper sx={{ p: 0, bgcolor: THEME.panelBg, border: THEME.border, flex: 1.5 }}>
                                <Box sx={{ p: 2, borderBottom: THEME.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <BugIcon sx={{ color: THEME.error, mr: 1 }} />
                                        <Typography variant="h6" sx={{ color: THEME.text }}>Breach Countermeasures</Typography>
                                    </Box>
                                    <Chip
                                        label="AUTO-POISONING: ACTIVE"
                                        size="small"
                                        sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', color: THEME.primary, border: `1px solid ${THEME.primary}` }}
                                    />
                                </Box>
                                <Box sx={{ p: 2 }}>
                                    <Typography variant="caption" sx={{ color: THEME.textDim, mb: 2, display: 'block' }}>
                                        Trackable Forensic Markers Injected:
                                    </Typography>

                                    {systemMode === 'BREACH_CONFIRMED' ? (
                                        <Box sx={{ p: 1, bgcolor: '#000', borderRadius: 1, border: '1px solid #333' }}>
                                            <Stack spacing={1}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" sx={{ color: THEME.success }}>✓ Admin API Keys (FAKE)</Typography>
                                                    <Typography variant="caption" sx={{ color: THEME.textDim }}>status: poisoning</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" sx={{ color: THEME.success }}>✓ Session Tokens (TRACKED)</Typography>
                                                    <Typography variant="caption" sx={{ color: THEME.textDim }}>status: poisoning</Typography>
                                                </Box>
                                                <Divider sx={{ my: 1, borderColor: '#222' }} />
                                                <Typography variant="caption" sx={{ color: THEME.primary, fontStyle: 'italic' }}>
                                                    Identity of attacker is now linked to these tokens. Session tracking active across devices.
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    ) : (
                                        <Box sx={{ p: 4, textAlign: 'center', opacity: 0.3 }}>
                                            <Typography variant="caption">Countermeasures Armed - Waiting for Breach Event</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>

                            {/* FORENSIC ANALYSIS */}
                            <Paper sx={{ p: 0, bgcolor: THEME.panelBg, border: THEME.border, flex: 1 }}>
                                <Box sx={{ p: 2, borderBottom: THEME.border, display: 'flex', alignItems: 'center' }}>
                                    <BlockchainIcon sx={{ color: THEME.primary, mr: 1 }} />
                                    <Typography variant="h6" sx={{ color: THEME.text }}>Forensic Ledger</Typography>
                                </Box>
                                <Box sx={{ p: 3 }}>
                                    <Typography variant="caption" sx={{ color: THEME.textDim, mb: 1, display: 'block' }}>IMMUTABLE PROOF BLOCKS:</Typography>
                                    <Typography variant="h4" sx={{ color: THEME.primary, mb: 1 }}>{blockchainCount}</Typography>
                                    <Typography variant="caption" sx={{ color: THEME.textDim }}>Evidence cannot be tampered with by attacker.</Typography>
                                </Box>
                            </Paper>
                        </Stack>
                    </Grid>
                </Grid>
            )}
        </Container>
    );
}

export default AttackMonitor;
