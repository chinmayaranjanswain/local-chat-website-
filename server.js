const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── In-Memory State ───────────────────────────────────────────
const activeUsers = new Map();       // socketId → { name, color, room }
const roomMessages = new Map();      // room → [{ id, name, text, timestamp, color, type }]
const MAX_MESSAGES = 500;

// ─── User Color Pool ───────────────────────────────────────────
const USER_COLORS = [
  '#6C5CE7', '#00B894', '#E17055', '#0984E3', '#E84393',
  '#00CEC9', '#FDCB6E', '#A29BFE', '#55EFC4', '#FF7675',
  '#74B9FF', '#FD79A8', '#81ECEC', '#FFEAA7', '#DFE6E9',
  '#6AB04C', '#EB4D4B', '#7ED6DF', '#E056A0', '#686DE0',
  '#F9CA24', '#30336B', '#22A6B3', '#BE2EDD', '#F0932B',
];
let colorIndex = 0;

function getNextColor() {
  const color = USER_COLORS[colorIndex % USER_COLORS.length];
  colorIndex++;
  return color;
}

// ─── Helpers ───────────────────────────────────────────────────
function getOnlineUsers(room) {
  const users = [];
  for (const [, user] of activeUsers) {
    if (user.room === room) {
      users.push({ name: user.name, color: user.color });
    }
  }
  return users;
}

function isNameTaken(name, room) {
  const lower = name.toLowerCase().trim();
  for (const user of activeUsers.values()) {
    if (user.room === room && user.name.toLowerCase().trim() === lower) return true;
  }
  return false;
}

function getRoomMessages(room) {
  if (!roomMessages.has(room)) {
    roomMessages.set(room, []);
  }
  return roomMessages.get(room);
}

function addRoomMessage(room, msg) {
  const msgs = getRoomMessages(room);
  msgs.push(msg);
  if (msgs.length > MAX_MESSAGES) msgs.shift();
}

function getLanIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// ─── Serve Static Frontend ─────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get server info
app.get('/api/info', (req, res) => {
  const lanIP = getLanIP();
  const port = PORT;
  res.json({
    lanIP,
    port,
    url: `http://${lanIP}:${port}`,
    onlineCount: activeUsers.size,
  });
});

// ─── Socket.IO Events ──────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // ── Join ──
  socket.on('user:join', (data, callback) => {
    const name = (data.name || '').trim();
    const room = (data.room || '').trim();

    if (!name || name.length < 1 || name.length > 24) {
      socket.emit('error:invalid_name', 'Name must be 1–24 characters.');
      if (callback) callback({ success: false, error: 'Name must be 1–24 characters.' });
      return;
    }

    if (!room || room.length < 1 || room.length > 50) {
      socket.emit('error:invalid_room', 'Room code must be 1–50 characters.');
      if (callback) callback({ success: false, error: 'Room code must be 1–50 characters.' });
      return;
    }

    if (isNameTaken(name, room)) {
      socket.emit('error:duplicate_name', `"${name}" is already taken in this room. Choose another.`);
      if (callback) callback({ success: false, error: `"${name}" is already taken in this room.` });
      return;
    }

    const color = getNextColor();
    activeUsers.set(socket.id, { name, color, room });

    // Join the Socket.IO room
    socket.join(room);

    // System message
    const joinMsg = {
      id: Date.now() + '-' + socket.id,
      type: 'system',
      text: `${name} joined the chat`,
      timestamp: new Date().toISOString(),
    };
    addRoomMessage(room, joinMsg);

    // Send existing messages to the joining user
    socket.emit('message:history', getRoomMessages(room));

    // Broadcast the join system message to everyone else in the room
    socket.to(room).emit('message:receive', joinMsg);

    // Update online users for everyone in the room
    io.to(room).emit('users:update', getOnlineUsers(room));

    console.log(`✅ ${name} joined room "${room}" (${socket.id})`);
    if (callback) callback({ success: true, name, color, room });
  });

  // ── Send Message ──
  socket.on('message:send', (text) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const trimmed = (text || '').trim().slice(0, 500);
    if (!trimmed) return;

    const msg = {
      id: Date.now() + '-' + socket.id,
      type: 'user',
      name: user.name,
      color: user.color,
      text: trimmed,
      timestamp: new Date().toISOString(),
    };
    addRoomMessage(user.room, msg);

    io.to(user.room).emit('message:receive', msg);
  });

  // ── Typing Indicator ──
  socket.on('user:typing', (isTyping) => {
    const user = activeUsers.get(socket.id);
    if (!user) return;
    socket.to(user.room).emit('user:typing', { name: user.name, isTyping });
  });

  // ── Leave Room (without disconnecting) ──
  socket.on('user:leave', (callback) => {
    const user = activeUsers.get(socket.id);
    if (!user) {
      if (callback) callback({ success: true });
      return;
    }

    const { name, room } = user;
    activeUsers.delete(socket.id);
    socket.leave(room);

    const leaveMsg = {
      id: Date.now() + '-' + socket.id,
      type: 'system',
      text: `${name} left the chat`,
      timestamp: new Date().toISOString(),
    };
    addRoomMessage(room, leaveMsg);

    io.to(room).emit('message:receive', leaveMsg);
    io.to(room).emit('users:update', getOnlineUsers(room));

    console.log(`👋 ${name} left room "${room}" (${socket.id})`);
    if (callback) callback({ success: true });
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (!user) return;

    const { name, room } = user;
    activeUsers.delete(socket.id);

    const leaveMsg = {
      id: Date.now() + '-' + socket.id,
      type: 'system',
      text: `${name} left the chat`,
      timestamp: new Date().toISOString(),
    };
    addRoomMessage(room, leaveMsg);

    io.to(room).emit('message:receive', leaveMsg);
    io.to(room).emit('users:update', getOnlineUsers(room));

    console.log(`❌ ${name} disconnected from room "${room}" (${socket.id})`);
  });
});

// ─── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  const lanIP = getLanIP();
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║         🗨️  ApniBaat is running!         ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log(`  ║  Local:   http://localhost:${PORT}          ║`);
  console.log(`  ║  Network: http://${lanIP}:${PORT}    ║`);
  console.log('  ║                                          ║');
  console.log('  ║  Share the Network URL with your team!   ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});
