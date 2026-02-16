import React, { useState, useEffect } from 'react';
import {
    Container, Paper, Typography, Box, Button, List, ListItem,
    ListItemText, Divider, CircularProgress
} from '@mui/material';
import { cartAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function Cart() {
    const [cart, setCart] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            const response = await cartAPI.get();
            setCart(response.data);
        } catch (err) {
            toast.error('Failed to load cart');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        try {
            const response = await cartAPI.checkout();
            toast.success(`Order placed! Total: $${response.data.total}`);
            navigate('/');
        } catch (err) {
            toast.error('Checkout failed');
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
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Shopping Cart
                </Typography>

                {cart.items.length === 0 ? (
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                        Your cart is empty
                    </Typography>
                ) : (
                    <>
                        <List>
                            {cart.items.map((item, index) => (
                                <React.Fragment key={index}>
                                    <ListItem>
                                        <ListItemText
                                            primary={item.name}
                                            secondary={`Quantity: ${item.quantity} × $${item.price}`}
                                        />
                                        <Typography variant="h6">
                                            ${item.subtotal.toFixed(2)}
                                        </Typography>
                                    </ListItem>
                                    {index < cart.items.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h5">
                                Total:
                            </Typography>
                            <Typography variant="h5" color="primary">
                                ${cart.total.toFixed(2)}
                            </Typography>
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{ mt: 3 }}
                            onClick={handleCheckout}
                        >
                            Checkout
                        </Button>
                    </>
                )}
            </Paper>
        </Container>
    );
}

export default Cart;
