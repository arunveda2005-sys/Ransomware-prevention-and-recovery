import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SecurityIcon from '@mui/icons-material/Security';
import BugReportIcon from '@mui/icons-material/BugReport';

function Navbar({ user, onLogout }) {
    return (
        <AppBar position="static">
            <Toolbar>
                <SecurityIcon sx={{ mr: 2 }} />
                <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
                    E-Commerce Defense
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>

                    {/* Public / Unauthenticated */}
                    {!user && (
                        <>
                            <Button color="inherit" component={RouterLink} to="/">Shop</Button>
                            <Button color="inherit" component={RouterLink} to="/login">Login</Button>
                            <Button color="inherit" component={RouterLink} to="/register">Register</Button>
                        </>
                    )}

                    {/* Authenticated User (Attacker Role for Demo) */}
                    {user && user.role === 'attacker' && (
                        <>
                            <Button
                                color="inherit"
                                component={RouterLink}
                                to="/attacker"
                                sx={{
                                    bgcolor: 'rgba(244, 67, 54, 0.2)',
                                    fontWeight: 'bold',
                                    '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.3)' }
                                }}
                            >
                                <BugReportIcon sx={{ mr: 1 }} />
                                Attacker Console
                            </Button>
                        </>
                    )}

                    {/* Admin (Defender Role) */}
                    {user?.role === 'admin' && (
                        <>
                            <Button color="inherit" component={RouterLink} to="/admin/attacks">
                                SOC Monitor
                            </Button>
                            <Button color="inherit" component={RouterLink} to="/admin/blockchain">
                                Blockchain Audit
                            </Button>
                            <Button color="inherit" component={RouterLink} to="/admin">
                                Usage Stats
                            </Button>
                        </>
                    )}

                    {/* User Info & Logout */}
                    {user && (
                        <>
                            <Typography sx={{ alignSelf: 'center', mx: 2, opacity: 0.7 }}>
                                {user.role.toUpperCase()}
                            </Typography>
                            <Button color="inherit" onClick={onLogout}>
                                Logout
                            </Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Navbar;
