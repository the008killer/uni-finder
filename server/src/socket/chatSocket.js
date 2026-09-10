// server/src/socket/chatSocket.js
const pool = require('../config/db');

module.exports = (io, socket) => {
    // Join a specific section room (groupId + section)
    socket.on('join_room', ({ groupId, section = 'general', userId }) => {
        if (!groupId) return;
        const roomKey = `room_${groupId}_${section}`;
        socket.join(roomKey);
        console.log(`User [${userId}] joined ${roomKey}`);
    });

    // Leave a section room when user switches
    socket.on('leave_room', ({ groupId, section = 'general' }) => {
        if (!groupId) return;
        socket.leave(`room_${groupId}_${section}`);
    });

    // Handle sending message to a specific section
    socket.on('send_message', async ({ groupId, section = 'general', userId, content }) => {
        if (!groupId || !userId || !content || !content.trim()) return;

        try {
            const msgRes = await pool.query(
                `INSERT INTO messages (group_id, user_id, content, section) 
                VALUES ($1, $2, $3, $4) 
                RETURNING id, content, sent_at, section`,
                [groupId, userId, content.trim(), section]
            );

            const userRes = await pool.query(
                'SELECT id, username, avatar_url FROM users WHERE id = $1',
                [userId]
            );

            const sender = userRes.rows[0];

            const completeMessage = {
                id: msgRes.rows[0].id,
                group_id: groupId,
                section: msgRes.rows[0].section,
                content: msgRes.rows[0].content,
                sent_at: msgRes.rows[0].sent_at,
                sender,
            };

            io.to(`room_${groupId}_${section}`).emit('new_message', completeMessage);

            const membersRes = await pool.query(
                'SELECT user_id FROM chat_members WHERE group_id = $1 AND user_id != $2',
                [groupId, userId]
            );
            // Check for @mentions
            const mentionMatches = content.match(/@(\w+)/g) || [];
            const mentionedUsernames = mentionMatches.map(m => m.slice(1).toLowerCase());

            // Get group name for notification text
            const groupRes = await pool.query('SELECT name FROM chat_groups WHERE id = $1', [groupId]);
            const groupName = groupRes.rows[0]?.name || 'a chat group';

            for (const member of membersRes.rows) {
                // Check if this member is mentioned
                const memberRes = await pool.query('SELECT username FROM users WHERE id = $1', [member.user_id]);
                const memberUsername = memberRes.rows[0]?.username?.toLowerCase();
                const isMentioned = mentionedUsernames.includes(memberUsername);

                const notifType = isMentioned ? 'mention' : 'message';
                const notifText = isMentioned
                    ? `@${sender.username} mentioned you in ${groupName}`
                    : `New message from ${sender.username} in ${groupName}`;

                await pool.query(
                    `INSERT INTO notifications (user_id, type, message, chat_group_id) 
           VALUES ($1, $2, $3, $4)`,
                    [member.user_id, notifType, notifText, groupId]
                );

                // Emit real-time notification to the member if they're online
                io.to(`user_${member.user_id}`).emit('new_notification', {
                    type: notifType,
                    message: notifText,
                    chat_group_id: groupId,
                    created_at: new Date().toISOString(),
                });
            }

            //  Update sender's read status
            await pool.query(
                `INSERT INTO chat_read_status (user_id, group_id, last_read_at) 
         VALUES ($1, $2, NOW()) 
         ON CONFLICT (user_id, group_id) DO UPDATE SET last_read_at = NOW()`,
                [userId, groupId]
            );
        } catch (err) {
            console.error('Socket message save error:', err.message);
        }
    });

    // Register user-specific room for real-time notifications
    socket.on('register_user', ({ userId }) => {
        if (!userId) return;
        socket.join(`user_${userId}`);
        console.log(`📡 Registered user_${userId} for notifications`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
};