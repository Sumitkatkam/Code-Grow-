import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true, // Consider removing this unless specifically needed
        reconnectionAttempt: 'Infinity',
        timeout: 1000,
        transports: ['websocket'],
    };

    const socket = io(process.env.REACT_APP_BACKEND_URL, options);

    // Optionally, you can handle connection events or errors here
    socket.on('connect', () => {
        console.log('Connected to socket server:', socket.id);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    return socket;
};
