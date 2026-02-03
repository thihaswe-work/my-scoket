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
const offlineDiv = document.getElementById("offlineUsers");
const profileBtn = document.getElementById("profileBtn");
const user = JSON.parse(localStorage.getItem("user"));
const welcome = document.getElementById("welcome");
const nameEl = document.createElement("h5");
nameEl.textContent = user.name;
profileBtn.append(nameEl);

// Render all users excluding self
const fetchUsers = async (onlineUserIds) => {
  try {
    const response = await fetch("http://localhost:5000/users", {
      method: "GET",
    });

    const data = await response.json();
    offlineUsers = data
      .filter((user) => !onlineUserIds.includes(user.id))
      .map((data) => data.id);

    renderUsers(offlineUsers, "offline");
  } catch (err) {
    console.log(err);
  }
};

// Render online users excluding self
function renderUsers(users, type) {
  type === "online" ? (onlineDiv.innerHTML = "") : (offlineDiv.innerHTML = " ");

  users.forEach((id) => {
    if (id === user.id) return;

    const div = document.createElement("div");
    div.className = `${type === "online" ? "online-user online" : "offline-user offline"}`;
    div.innerHTML = `<span class="dot"></span> User ${id}`;
    type === "online"
      ? onlineDiv.appendChild(div)
      : offlineDiv.appendChild(div);

    div.addEventListener("click", () => {
      // Show in header
      chatWithEl.textContent = `Chat with User ${id}`;

      // Join private room
      currentRoom = getRoomName(user.id, id);
      socket.emit("join room", currentRoom, user.id);

      // Clear previous messages
      messages.innerHTML = "";
      welcome.style.display = "none";
      form.style.display = "flex";
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

// Identify user to server
socket.emit("identify", user.id);

// Listen for online users
socket.on("online-users", (users) => {
  renderUsers(users, "online");
  fetchUsers(users);
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
  messagesArr.forEach((msg) => {
    const isMe = msg.senderId === user.id;
    addMessage(msg.text, isMe);
  });
});
