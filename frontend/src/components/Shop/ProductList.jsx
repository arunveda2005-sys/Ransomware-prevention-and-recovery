import React, { useState, useEffect } from 'react';
import {
    Container, Grid, Card, CardContent, CardMedia, Typography,
    Button, TextField, Box, CircularProgress, Alert
} from '@mui/material';
import { productsAPI, cartAPI } from '../../services/api';
import { toast } from 'react-toastify';

function ProductList({ securityState }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const safeMode = securityState?.safe_mode;

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const response = await productsAPI.getAll(1, search);
            setProducts(response.data.products);
        } catch (err) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        loadProducts();
    };

    const handleAddToCart = async (productId) => {
        try {
            await cartAPI.add(productId, 1);
            toast.success('Added to cart!');
        } catch (err) {
            if (err.response?.status === 401) {
                toast.error('Please login to add items to cart');
            } else {
                toast.error('Failed to add to cart');
            }
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
                Products
            </Typography>

            {safeMode && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {securityState?.message || 'Safe mode is active.'} Shopping remains visible, but high-risk actions may be restricted while the attack is contained.
                </Alert>
            )}

            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    fullWidth
                    label="Search products"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="contained" onClick={handleSearch}>
                    Search
                </Button>
            </Box>

            <Grid container spacing={3}>
                {products.map((product) => (
                    <Grid item xs={12} sm={6} md={4} key={product._id}>
                        <Card>
                            <CardMedia
                                component="img"
                                height="200"
                                image={product.image_url}
                                alt={product.name}
                            />
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {product.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {product.description}
                                </Typography>
                                <Typography variant="h6" color="primary" gutterBottom>
                                    ${product.price}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Stock: {product.stock}
                                </Typography>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 2 }}
                                    onClick={() => handleAddToCart(product._id)}
                                    disabled={product.stock === 0 || safeMode}
                                >
                                    {safeMode ? 'Temporarily Disabled' : 'Add to Cart'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {products.length === 0 && (
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 4 }}>
                    No products found
                </Typography>
            )}
        </Container>
    );
}

export default ProductList;
