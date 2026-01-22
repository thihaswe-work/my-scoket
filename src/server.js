import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import authRouter from "./routes/auth.route.js";
import adminRouter from "./routes/admin.route.js";
import setupSocket from "./utils/socket.js";
import db from "./utils/db.js";
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
app.use("/admin/", adminRouter);

setupSocket(io, db);

server.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
