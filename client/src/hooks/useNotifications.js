import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { fetchUnreadCount, markNotificationsRead } from '../services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useNotifications(user) {
    const [unreadCount, setUnreadCount] = useState(0);

    // Poll unread count on mount
    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        fetchUnreadCount()
            .then(res => res.data.success && setUnreadCount(res.data.count))
            .catch(() => { });

        // Listen for real-time notification updates
        const socket = io(SOCKET_URL, {
            transports: ['polling', 'websocket'],
            reconnection: true,
        });

        socket.on('connect', () => {
            socket.emit('register_user', { userId: user.id });
        });

        socket.on('new_notification', () => {
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            socket.disconnect();
        };
    }, [user?.id]);

    const markRead = async () => {
        try {
            await markNotificationsRead();
            setUnreadCount(0);
        } catch (err) {
            console.error('Mark read failed:', err);
        }
    };

    return { unreadCount, markRead };
}