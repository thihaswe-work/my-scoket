// utils/socket.js
export default function setupSocket(io, db) {
  // Map to track online users: userId -> array of socketIds
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("connected:", socket.id);

    // Identify user
    socket.on("identify", (userId) => {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, []);
      }
      onlineUsers.get(userId).push(socket.id);
      console.log(`User ${userId} is online`);

      io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    // Global chat message (optional)
    socket.on("chat message", async (payload) => {
      if (!payload?.text || !payload?.senderId) return;

      // For global messages, use room_id = NULL (or create a global room if needed)
      await db.run(
        "INSERT INTO messages (room_id, sender_id, content) VALUES (?, ?, ?)",
        null,
        payload.senderId,
        payload.text,
      );

      io.emit("chat message", {
        text: payload.text,
        senderId: payload.senderId,
        createdAt: new Date().toISOString(),
      });
    });

    // Join a specific room
    socket.on("join room", async (roomName) => {
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room ${roomName}`);
    });

    // Send message to a specific room
    socket.on("room message", async ({ roomName, senderId, text }) => {
      if (!roomName || !senderId || !text) return;

      // Save to DB: find room_id by roomName
      const room = await db.get(
        "SELECT id FROM rooms WHERE name = ? OR id = ?",
        roomName,
        roomName,
      );
      if (room) {
        await db.run(
          "INSERT INTO messages (room_id, sender_id, content) VALUES (?, ?, ?)",
          room.id,
          senderId,
          text,
        );
      }

      // Broadcast to all clients in room
      io.to(roomName).emit("room message", {
        senderId,
        text,
        createdAt: new Date().toISOString(),
      });
    });

    // Chat namespace
    const chatNamespace = io.of("/chat");
    chatNamespace.on("connection", (socket) => {
      console.log("User connected to chat namespace");

      socket.on("message", (msg) => {
        chatNamespace.emit("message", msg);
      });
    });

    // Notifications namespace
    const notificationsNamespace = io.of("/notifications");
    notificationsNamespace.on("connection", (socket) => {
      console.log("User connected to notifications namespace");

      socket.emit("notification", "Welcome to notifications!");

      setInterval(() => {
        socket.emit(
          "notification",
          `New alert at ${new Date().toLocaleTimeString()}`,
        );
      }, 10000);
    });

    // Disconnect
    socket.on("disconnect", () => {
      for (const [userId, sockets] of onlineUsers.entries()) {
        const index = sockets.indexOf(socket.id);
        if (index !== -1) {
          sockets.splice(index, 1);
          if (sockets.length === 0) {
            onlineUsers.delete(userId);
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
