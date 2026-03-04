import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let socket = null;
let threatListeners = [];
let canaryListeners = [];
let honeytokenListeners = [];

export const initWebSocket = (token) => {
    if (socket) {
        socket.disconnect();
    }

    socket = io(BACKEND_URL, {
        auth: { token },
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('✓ WebSocket connected');
        socket.emit('join_admin');
        socket.emit('subscribe_threats');
    });

    socket.on('disconnect', () => {
        console.log('✗ WebSocket disconnected');
    });

    socket.on('threat_detected', (data) => {
        console.log('Threat detected:', data);
        threatListeners.forEach(listener => listener(data));
    });

    socket.on('canary_triggered', (data) => {
        console.log('🚨 Canary triggered:', data);
        canaryListeners.forEach(listener => listener(data));
    });

    socket.on('honeytoken_triggered', (data) => {
        console.log('🚨 Honeytoken triggered:', data);
        honeytokenListeners.forEach(listener => listener(data));
    });

    return socket;
};

export const subscribeToThreats = (callback) => {
    threatListeners.push(callback);

    // Return unsubscribe function
    return () => {
        threatListeners = threatListeners.filter(l => l !== callback);
    };
};

export const subscribeToCanaries = (callback) => {
    canaryListeners.push(callback);

    return () => {
        canaryListeners = canaryListeners.filter(l => l !== callback);
    };
};

export const subscribeToHoneytokens = (callback) => {
    honeytokenListeners.push(callback);

    return () => {
        honeytokenListeners = honeytokenListeners.filter(l => l !== callback);
    };
};

export const disconnectWebSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    threatListeners = [];
    canaryListeners = [];
    honeytokenListeners = [];
};
