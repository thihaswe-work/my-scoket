import db from "../utils/db.js";

// export const getAllLastSeenMessagesByUserId = (req, res) => {
//   const userId = req.userId;
//   console.log("lastseen message", userId);

//   db.all(
//     `SELECT * FROM user_last_seen_messages WHERE user_id = ?`,
//     [userId],
//     (err, rows) => {
//       if (err) {
//         return res.status(500).json({ error: err.message });
//       }

//       console.log(rows); // ✅ actual data
//       res.status(200).json(rows);
//     },
//   );
// };

export const getAllLastSeenMessagesByUserId = async (req, res) => {
  try {
    const userId = req.userId;

    const lastMessages = await db.all(
      `SELECT * FROM user_last_seen_messages WHERE user_id = ?`,
      [userId],
    );

    res.status(200).json(lastMessages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
