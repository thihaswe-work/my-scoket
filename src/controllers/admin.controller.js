import db from "../utils/db.js";

export const getAllUsers = async (req, res) => {
  const users = await db.all("SELECT id, name, email, created_at FROM users");
  res.json(users);
};

export const createUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  await db.run(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    name,
    email,
    password,
  );

  res.json({ message: "User created" });
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  await db.run(
    "UPDATE users SET name = ?, email = ? WHERE id = ?",
    name,
    email,
    id,
  );

  res.json({ message: "User updated" });
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  await db.run("DELETE FROM users WHERE id = ?", id);

  res.json({ message: "User deleted" });
};
