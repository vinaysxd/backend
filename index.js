require("dotenv").config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const db = require('./db');
const { Server } = require('socket.io');
const http = require('http'); 
const jwt = require("jsonwebtoken");
const cors = require('cors');
const onlineUsers = new Map();
// Initialize database tables
require('./models/init');
app.use(express.json());
app.use(cors());
// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chats');
const messageRoutes = require('./routes/messages');
const socketValidation = require("./middlewares/socketValidate");
const authMiddleware = require("./middlewares/authMiddleware");
const { Message } = require("./models/init");

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',  // allow all origins for testing
    methods: ['GET','POST']
  }
});
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication error: No token provided."));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error("Authentication error: Invalid token."));
    }

    socket.decoded = decoded; // attach user info

    const existingSocketId = onlineUsers.get(decoded.id);
    if (existingSocketId) { 
      const oldSocket = io.sockets.sockets.get(existingSocketId);
      if (oldSocket) {
        oldSocket.disconnect(true);
        console.log(`⚠️ Duplicate detected. Old socket ${existingSocketId} disconnected for user ${decoded.id}`);
      }
    }

    next(); // ✅ always call next() if token is valid
  });
});

io.on("connection", (socket) => {
  console.log("✅ User connected with valid token:", socket.decoded);

  // Save the userId -> socketId mapping
  onlineUsers.set(String(socket.decoded.id), socket.id);

  console.log("🔗 Online users:", onlineUsers);
socket.on('send-message',async ({toUserId, content, receiver})=>{
  console.log('reciever',receiver)
     const recipientSocId = onlineUsers.get(receiver.toString())  
     const newMessage = await Message.create({
        chat_id: toUserId,
        sender_id: socket.decoded.id,
        content,
      });  
      console.log('==========New Message========', newMessage.dataValues)
      // const messageObj: ReChatMessage = {
  //   id: Date.now(), // Or use a better unique ID generator
  //   sender_id: currentUserId, // You should have this from user context or props
  //   content: newMessage.trim(),
  //   timestamp: new Date().toISOString(),
  // };
  delete newMessage.chat_id
       io.to(recipientSocId).emit('receive-message', newMessage)
})

  socket.on("disconnect", () => {
    console.log(`❌ User ${socket.decoded.id} disconnected`);
    if (onlineUsers.get(socket.decoded.id) === socket.id) {
      onlineUsers.delete(socket.decoded.id); // cleanup only if this socket was the latest
    }
  });
});

// Use routes
app.use('/auth', authRoutes);
app.use('/users',authMiddleware, userRoutes);
app.use('/chats',authMiddleware, chatRoutes);
app.use('/messages',authMiddleware, messageRoutes);

// ✅ Start the server using the HTTP server, not app.listen
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
