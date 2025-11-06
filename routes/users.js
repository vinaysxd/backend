const express = require("express");
const router = express.Router();   
const authMiddleware = require("../middlewares/authMiddleware");
const { User } = require("../models/init");

// // Placeholder routes
// router.get('/', (req, res) => {
//   res.send('Get all users');
// });

router.get('/:id', (req, res) => {
  res.send(`Get user ${req.params.id}`);
});

router.put('/:id', (req, res) => {
  res.send(`Update user ${req.params.id}`);
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    const userId = req.user.id; // from authenticate middleware

    if (!search || search.trim() === "") {
      return res.json([]); // return empty array if no search
    }

    const users = await User.findAll({
      where: {
        // match username LIKE search or ID = search if numeric
        username: { [require("sequelize").Op.iLike]: `%${search}%` },
        id: { [require("sequelize").Op.ne]: userId }, // exclude current user
      },
      attributes: ["id", "username", "avatar"], // only send necessary fields
      limit: 10, // limit results for performance
    });

    res.json(users);
  } catch (error) {
    console.error("User search error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});
module.exports = router;
