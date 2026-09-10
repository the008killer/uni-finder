import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { fetchChatMessagesBySection, joinChatGroup } from '../services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useChat(groupId, section, user) {
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);
    const userId = user?.id;

    // Persistent socket connection
    useEffect(() => {
        if (!userId) return;

        const socket = io(SOCKET_URL, {
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('register_user', { userId });
        });
        socket.on('disconnect', () => setConnected(false));

        return () => {
            socket.disconnect();
        };
    }, [userId]);

    // Join room + load history when group or section changes
    useEffect(() => {
        const socket = socketRef.current;
        if (!groupId || !section || !userId || !socket) return;

        joinChatGroup(groupId).catch(() => { });
        socket.emit('join_room', { groupId, section, userId });

        fetchChatMessagesBySection(groupId, section)
            .then(res => {
                if (res.data.success) setMessages(res.data.data);
            })
            .catch(() => setMessages([]));

        const handleNewMessage = (msg) => {
            if (String(msg.group_id) === String(groupId) && msg.section === section) {
                setMessages(prev => [...prev, msg]);
            }
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.emit('leave_room', { groupId, section });
        };
    }, [groupId, section, userId]);

    const sendMessage = useCallback((content) => {
        if (!socketRef.current || !groupId || !userId || !content.trim()) return;
        socketRef.current.emit('send_message', {
            groupId,
            section,
            userId,
            content: content.trim(),
        });
    }, [groupId, section, userId]);

    return { messages, connected, sendMessage };
}