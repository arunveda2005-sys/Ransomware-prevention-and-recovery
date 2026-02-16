import React, { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, Box, Accordion, AccordionSummary,
    AccordionDetails, Chip, CircularProgress, Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';

function BlockchainViewer() {
    const [blockchain, setBlockchain] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBlockchain();
    }, []);

    const loadBlockchain = async () => {
        try {
            const response = await adminAPI.getBlockchain();
            setBlockchain(response.data);
        } catch (err) {
            toast.error('Failed to load blockchain');
        } finally {
            setLoading(false);
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
                🔗 Blockchain Audit Trail
            </Typography>

            <Alert severity={blockchain?.is_valid ? 'success' : 'error'} sx={{ mb: 3 }}>
                <Typography variant="h6">
                    Chain Integrity: {blockchain?.is_valid ? '✓ VALID' : '✗ INVALID'}
                </Typography>
                <Typography variant="body2">
                    {blockchain?.blockchain?.length || 0} blocks in chain
                </Typography>
            </Alert>

            {blockchain?.blockchain?.map((block, index) => (
                <Accordion key={index} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <Chip
                                label={`Block #${block.index}`}
                                color={block.index === 0 ? 'secondary' : 'primary'}
                            />
                            <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                Hash: {block.hash.substring(0, 16)}...
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {block.data.count || 0} events
                            </Typography>
                        </Box>
                    </AccordionSummary>

                    <AccordionDetails>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Timestamp:</strong> {new Date(block.timestamp).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Previous Hash:</strong> {block.previous_hash}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Hash:</strong> {block.hash}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Nonce:</strong> {block.nonce}
                            </Typography>
                        </Box>

                        {block.data.events && block.data.events.length > 0 && (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Events:
                                </Typography>
                                {block.data.events.map((event, eventIndex) => (
                                    <Paper key={eventIndex} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                                        <Typography variant="body2">
                                            <strong>Session:</strong> {event.session_id?.substring(0, 8)}...
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Risk Score:</strong> {(event.risk_score * 100).toFixed(1)}%
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Action:</strong> {event.action}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Reasoning:</strong> {event.reasoning}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </Typography>
                                    </Paper>
                                ))}
                            </Box>
                        )}

                        {block.index === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                Genesis Block - {block.data.message}
                            </Typography>
                        )}
                    </AccordionDetails>
                </Accordion>
            ))}

            {(!blockchain?.blockchain || blockchain.blockchain.length === 0) && (
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 4 }}>
                    No blocks in blockchain yet
                </Typography>
            )}
        </Container>
    );
}

export default BlockchainViewer;
