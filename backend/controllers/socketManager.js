const { Server } = require('socket.io'); // Updated to CommonJS require

let connections = {};
let messages = {};
let timeOnline = {};

const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['*'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('SOMETHING CONNECTED');

    socket.on('join-call', (path) => {
      if (!connections[path]) {
        connections[path] = [];
      }
      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      // Notify all users in the room of the new user joining
      connections[path].forEach((socketId) => {
        io.to(socketId).emit('user-joined', socket.id, connections[path]);
      });

      // Send chat history to the newly joined user
      if (messages[path]) {
        messages[path].forEach(({ data, sender, socketIdSender }) => {
          io.to(socket.id).emit('chat-message', data, sender, socketIdSender);
        });
      }
    });

    socket.on('signal', (toId, message) => {
      io.to(toId).emit('signal', socket.id, message);
    });

    socket.on('chat-message', (data, sender) => {
      // Find the room the socket belongs to
      const matchingRoom = Object.keys(connections).find((room) =>
        connections[room].includes(socket.id)
      );

      if (matchingRoom) {
        if (!messages[matchingRoom]) {
          messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
          sender,
          data,
          'socket-id-sender': socket.id,
        });
        console.log('Message:', matchingRoom, ':', sender, data);

        // Send the message to everyone in the room
        connections[matchingRoom].forEach((socketId) => {
          io.to(socketId).emit('chat-message', data, sender, socket.id);
        });
      }
    });

    socket.on('disconnect', () => {
      const disconnectTime = new Date();
      const timeSpent = Math.abs(timeOnline[socket.id] - disconnectTime);
      delete timeOnline[socket.id];

      // Find the room the user was in and notify others
      Object.entries(connections).forEach(([room, socketIds]) => {
        if (socketIds.includes(socket.id)) {
          connections[room] = socketIds.filter((id) => id !== socket.id);

          // Notify others in the room that the user left
          connections[room].forEach((socketId) => {
            io.to(socketId).emit('user-left', socket.id);
          });

          // If the room is now empty, delete it
          if (connections[room].length === 0) {
            delete connections[room];
          }
        }
      });
    });
  });

  return io;
};

module.exports = { connectToSocket }; // Export using CommonJS
