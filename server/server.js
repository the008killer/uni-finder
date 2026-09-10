require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const {Server} = require('socket.io');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

const registerChatHandlers = require('./src/socket/chatSocket');
io.on('connection', (socket) => {
  registerChatHandlers(io, socket);
});
server.listen(PORT, () => {
  console.log(`UniFinder API running on http://localhost:${PORT}`);
});