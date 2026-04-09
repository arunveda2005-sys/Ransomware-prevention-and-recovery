import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Ensure the API URL properly points to the /api backend routes
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

// Generate session ID
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('sessionId', sessionId);
}

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Session-ID': sessionId
    }
});

// Add auth token AND Mock IP to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // FULL SESSION SPOOFING:
    // If we are simulating an attacker, send the Mock IP for EVERY request
    // This allows the backend to block standard navigation (Shop, Cart) too!
    const mockIp = localStorage.getItem('mockIp');
    if (mockIp) {
        config.headers['X-Mock-IP'] = mockIp;
    }
    return config;
});

// Response Interceptor: Enforce Logout on Block
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If the backend blocks us (403), and we are simulating an attacker
        if (error.response && error.response.status === 403) {
            const mockIp = localStorage.getItem('mockIp');
            if (mockIp) {
                console.error("⛔ ACCESS DENIED - SESSION TERMINATED");
                // Clear Access
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Clear mockIp so the "attacker" can try again with a new identity
                localStorage.removeItem('mockIp');

                // Force Redirect to Login
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// API methods
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (email, password, name) => api.post('/auth/register', { email, password, name })
};

export const productsAPI = {
    getAll: (page = 1, search = '') => api.get(`/products?page=${page}&search=${search}`),
    getOne: (id) => api.get(`/products/${id}`)
};

export const cartAPI = {
    get: () => api.get('/cart'),
    add: (productId, quantity) => api.post('/cart/add', { product_id: productId, quantity }),
    checkout: () => api.post('/cart/checkout')
};

export const adminAPI = {
    getDashboard: () => api.get('/admin/dashboard'),
    getLiveThreats: () => api.get('/admin/threats/live'),
    clearThreats: () => api.delete('/admin/threats/all'),
    getBlockchain: () => api.get('/admin/blockchain'),
    deployCanaries: (count) => api.post('/admin/canaries/deploy', { count }),
    getCanaryStats: () => api.get('/admin/canaries/stats'),
    exportUsers: () => api.get('/admin/users/export'),
    unbanIP: (ip) => api.post('/admin/ip/unban', { ip }),
    blockIP: (ip) => api.post('/admin/ip/block', { ip }),
    getBannedIPs: () => api.get('/admin/ip/list'),
    getMitreReport: () => api.get('/admin/reports/mitre'),
    createBackup: () => api.post('/admin/backup/snapshot'),
    restoreBackup: (snapshot_id) => api.post('/admin/backup/restore', { snapshot_id }),
    listBackups: () => api.get('/admin/backup/list')
};

export const securityAPI = {
    getStatus: () => api.get('/security/status')
};

export default api;
