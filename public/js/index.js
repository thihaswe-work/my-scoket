// import { io } from "socket.io-client";

const socket = io();

const chatSocket = io("/chat");
chatSocket.on("message", (msg) => console.log("Chat message:", msg));

// Send chat message
function sendMessage(msg) {
  chatSocket.emit("message", msg);
}

// Notifications namespace
const notificationsSocket = io("/notifications");
notificationsSocket.on("notification", (msg) =>
  console.log("Notification:", msg),
);

let currentRoom = null;

const chatWithEl = document.getElementById("chatWith");
const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const logoutBtn = document.getElementById("logoutBtn");
const onlineDiv = document.getElementById("onlineUsers");
const profileBtn = document.getElementById("profileBtn");
const user = JSON.parse(localStorage.getItem("user"));

// Show logged-in user in sidebar
const nameEl = document.createElement("h5");
nameEl.textContent = user.name;
profileBtn.append(nameEl);

// Identify user to server
socket.emit("identify", user.id);

// Listen for online users
socket.on("online-users", (users) => {
  renderOnlineUsers(users);
});

// Render online users excluding self
function renderOnlineUsers(users) {
  onlineDiv.innerHTML = "";

  users.forEach((id) => {
    if (id === user.id) return;

    const div = document.createElement("div");
    div.className = "online-user online";
    div.innerHTML = `<span class="dot"></span> User ${id}`;
    onlineDiv.appendChild(div);

    div.addEventListener("click", () => {
      // Show in header
      chatWithEl.textContent = `Chat with User ${id}`;

      // Join private room
      currentRoom = getRoomName(user.id, id);
      socket.emit("join room", currentRoom, user.id);

      // Clear previous messages
      messages.innerHTML = "";
    });
  });
}

// Helper: consistent room name for 1-to-1 chat
function getRoomName(userId1, userId2) {
  return [userId1, userId2].sort().join("_");
}

// Send message to current room
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!input.value || !currentRoom) return;

  const msg = {
    roomName: currentRoom,
    senderId: user.id,
    text: input.value,
  };
  socket.emit("room message", msg);

  input.value = "";
});

// Listen for messages from rooms
socket.on("room message", (msg) => {
  // Only show messages if they belong to current room
  if (!currentRoom || msg.roomName !== currentRoom) return;
  const isMe = msg.senderId === user.id;
  addMessage(msg.text, isMe);
});

socket.on("room history", (messagesArr) => {
  // Clear existing messages
  messages.innerHTML = "";
  console.log("messages history", messagesArr);
  messagesArr.forEach((msg) => {
    const isMe = msg.senderId === user.id;
    addMessage(msg.text, isMe);
  });
});

// Helper to add messages to chat
function addMessage(text, isMe) {
  const li = document.createElement("li");
  li.className = `message ${isMe ? "me" : "other"}`;
  li.textContent = text;
  console.log(li, messages);
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}

// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/login.html";
});
