import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import authRouter from "./routes/auth.route.js";

// ← IMPORT DB HERE
import db from "./utils/db.js"; // <--- a
const port = 5000;
const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "../public/index.html"));
});

app.use("/auth", authRouter);

/**
 * Socket.IO
 */
io.on("connection", (socket) => {
  console.log("connected:", socket.id);

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
  socket.on("disconnect", () => {
    console.log("disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
