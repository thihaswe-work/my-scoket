// utils/socket.js
export default function setupSocket(io, db) {
  // Map to track online users: userId -> array of socketIds
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("connected:", socket.id);

    socket.on("identify", (userId) => {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, []);
      }
      onlineUsers.get(userId).push(socket.id);
      console.log(`User ${userId} is online`);

      io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    socket.on("chat message", async (payload) => {
      if (!payload?.text || !payload?.senderId) return;

      await db.run(
        "INSERT INTO messages (sender_id, message) VALUES (?, ?)",
        payload.senderId,
        payload.text,
      );

      io.emit("chat message", {
        text: payload.text,
        senderId: payload.senderId,
        createdAt: new Date().toISOString(),
      });
    });

    // Join a room (room name can be private: e.g., "user1_user2")
    socket.on("join room", (roomName) => {
      socket.join(roomName);
      console.log(`${socket.id} joined room ${roomName}`);
    });

    // Sending message to a specific room
    socket.on("room message", ({ roomName, senderId, text }) => {
      io.to(roomName).emit("room message", { senderId, text });
    });

    // Chat namespace
    const chatNamespace = io.of("/chat");
    chatNamespace.on("connection", (socket) => {
      console.log("User connected to chat namespace");

      socket.on("message", (msg) => {
        // Broadcast chat messages to all clients in /chat
        chatNamespace.emit("message", msg);
      });
    });

    // Notifications namespace
    const notificationsNamespace = io.of("/notifications");
    notificationsNamespace.on("connection", (socket) => {
      console.log("User connected to notifications namespace");

      // Send a welcome notification
      socket.emit("notification", "Welcome to notifications!");

      // Example: send notifications periodically
      setInterval(() => {
        socket.emit(
          "notification",
          `New alert at ${new Date().toLocaleTimeString()}`,
        );
      }, 10000);
    });

    socket.on("disconnect", () => {
      // Remove socket from onlineUsers map
      for (const [userId, sockets] of onlineUsers.entries()) {
        const index = sockets.indexOf(socket.id);
        if (index !== -1) {
          sockets.splice(index, 1); // remove this socket
          if (sockets.length === 0) {
            onlineUsers.delete(userId); // no more sockets, user offline
            console.log(`User ${userId} went offline`);
          }
          break;
        }
      }

      io.emit("online-users", Array.from(onlineUsers.keys()));
      console.log("disconnected:", socket.id);
    });
  });
}
