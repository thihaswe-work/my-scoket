import { db } from "../utils/db.js";
export const registerController = async (req, res) => {
  const { email, name, password } = req.body;
  console.log(email, name, password);
  if (!email || !name || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    await db.run("INSERT INTO users (email, name, password) VALUES (?, ?, ?)", [
      email,
      name,
      password,
    ]);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ message: "User already exists" });
  }
};

export const loginController = async (req, res) => {
  const { email, password } = req.body;

  const user = await db.get(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
  );

  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  res.json({ message: "Login successful", data: user });
};

export const logoutController = async (req, res) => {
  res.redirect("/login.html");
};
