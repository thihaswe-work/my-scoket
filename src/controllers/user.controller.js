import db from "../utils/db.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await db.all(`SELECT id FROM users`);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
