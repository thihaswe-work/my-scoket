export default function setupSocket(io, db) {
  const onlineUsers = new Map();

  // -------------------------
  // Root namespace
  // -------------------------
  io.on("connection", (socket) => {
    console.log("connected:", socket.id);

    socket.on("identify", (userId) => {
      if (!onlineUsers.has(userId)) onlineUsers.set(userId, []);
      onlineUsers.get(userId).push(socket.id);

      console.log(`User ${userId} is online`);
      io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    socket.on("join room", async (roomName, userId) => {
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room ${roomName} `);

      try {
        // Try to get the room
        let room = await db.get(
          "SELECT id FROM rooms WHERE name = ?",
          roomName,
        );

        // If room doesn't exist, create it
        if (!room) {
          const result = await db.run(
            "INSERT INTO rooms (name) VALUES (?)",
            roomName,
          );
          room = { id: result.lastID };
          console.log(`Created new room "${roomName}" with id ${room.id}`);
        }

        // Get last message in the room
        const lastMessage = await db.get(
          "SELECT id FROM messages WHERE room_id = ? ORDER BY created_at DESC LIMIT 1",
          room.id,
        );

        if (lastMessage) {
          await db.run(
            `INSERT INTO user_last_seen_message(user_id, room_id, last_message_id)
       VALUES(?, ?, ?)
       ON CONFLICT(user_id, room_id) 
       DO UPDATE SET last_message_id=excluded.last_message_id`,
            userId,
            room.id,
            lastMessage.id,
          );
        }

        // Ensure this user is in the room_users table
        const roomUser = await db.get(
          "SELECT id FROM room_users WHERE room_id = ? AND user_id = ?",
          room.id,
          userId,
        );

        if (!roomUser) {
          await db.run(
            "INSERT INTO room_users (room_id, user_id) VALUES (?, ?)",
            room.id,
            userId,
          );
          console.log(`Added user ${userId} to room ${room.id}`);
        }

        // Get last 15 messages for this room
        const messages = await db.all(
          "SELECT sender_id AS senderId, content AS text, created_at AS createdAt " +
            "FROM messages WHERE room_id = ? ORDER BY created_at DESC LIMIT 15",
          room.id,
        );

        // Reverse to send oldest first
        const orderedMessages = messages.reverse() || [];
        // Send only to the socket that joined
        socket.emit("room history", orderedMessages);
      } catch (err) {
        console.error("Error fetching or creating room messages:", err);
      }
    });

    socket.on("room message", async ({ roomName, senderId, text }) => {
      if (!roomName || !senderId || !text) return;

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

      io.to(roomName).emit("room message", {
        senderId,
        roomName,
        text,
        createdAt: new Date().toISOString(),
      });

      // Notify users in other rooms
      const usersInRoom = await db.all(
        "SELECT user_id FROM room_users WHERE room_id = ? AND user_id != ?",
        room.id,
        senderId,
      );

      for (const { user_id } of usersInRoom) {
        const sockets = onlineUsers.get(user_id) || [];
        for (const sockId of sockets) {
          // Only notify if they are NOT in the current room
          const socketRoom = Array.from(io.sockets.sockets.get(sockId).rooms);
          if (!socketRoom.includes(roomName)) {
            io.to(sockId).emit("new-message-notification", {
              roomName,
              text,
              senderId,
            });
          }
        }
      }
    });

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

  // -------------------------
  // Chat namespace
  // -------------------------
  const chatNamespace = io.of("/chat");
  chatNamespace.on("connection", (socket) => {
    console.log("User connected to chat namespace");

    socket.on("message", (msg) => {
      chatNamespace.emit("message", msg);
    });
  });

  // -------------------------
  // Notifications namespace
  // -------------------------
  const notificationsNamespace = io.of("/notifications");
  notificationsNamespace.on("connection", (socket) => {
    console.log("User connected to notifications namespace");

    socket.emit("notification", "Welcome to notifications!");

    const interval = setInterval(() => {
      socket.emit(
        "notification",
        `New alert at ${new Date().toLocaleTimeString()}`,
      );
    }, 10000);

    socket.on("disconnect", () => clearInterval(interval));
  });
}
