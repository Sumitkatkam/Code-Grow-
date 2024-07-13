const express = require('express');
const ACTIONS = require('./src/Actions');
const app = express();
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('build'));
app.use((req, res, next) =>{
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


const userSocketMap = {};
function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(socketId => {
    return {
      socketId,
      username: userSocketMap[socketId],
    };
  });
}

io.on('connection', socket => {
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    for (const [id, name] of Object.entries(userSocketMap)) {
      if (name === username && id !== socket.id) {
        delete userSocketMap[id];
        io.to(id).emit(ACTIONS.DISCONNECTED, {
          socketId: id,
          username: name,
        });
        io.sockets.sockets.get(id).disconnect(true);
      }
    }

    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on('disconnecting', () => {
    const rooms = [...socket.rooms];
    rooms.forEach(roomId => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
  });

  socket.on('disconnect', () => {
    delete userSocketMap[socket.id];
    const rooms = [...socket.rooms];
    rooms.forEach(roomId => {
      const clients = getAllConnectedClients(roomId);
      clients.forEach(({ socketId }) => {
        io.to(socketId).emit(ACTIONS.JOINED, {
          clients,
          username: userSocketMap[socketId],
        });
      });
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
