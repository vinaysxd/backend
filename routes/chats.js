const express = require('express');
const { Chat, User, sequelize, ChatUser, Message } = require('../models/init');
const { Sequelize, Op } = require('sequelize');
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.user.id; // logged-in user from middleware

    // Get all chats the user is part of
    const chats = await Chat.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "username", "email", "avatar"],
          through: { attributes: [] },
          where: { id: userId }, // only chats this user belongs to
        },
      ],
    });

    const chatDetails = await Promise.all(
      chats.map(async (chat) => {
        // Fetch all participants
        const participants = await chat.getUsers({
          attributes: ["id", "username", "email", "avatar"],
        });

        // Exclude the requesting user
        const otherParticipants = participants.filter(
          (u) => u.id !== userId
        );

        const lastMessage = await Message.findOne({
          where: { chat_id: chat.id },
          order: [["timestamp", "DESC"]],
          attributes: ["id", "content", "timestamp", "sender_id"],
        });

        return {
          id: chat.id,
          name: chat.name,
          is_group: chat.is_group,
          participants: otherParticipants, // array excluding requesting user
          lastMessage,
        };
      })
    );

    res.json(chatDetails);
  } catch (error) {
    console.error("❌ Get chats error:", error);
    res.status(500).json({ error: "Server error" });
  }
});



router.post('/',async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const userId = req.user.id; // from auth middleware
    console.log(userId)
    if (!otherUserId) {
      return res.status(400).json({ message: "otherUserId is required" });
    }

    if (otherUserId === userId) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    } 
    const userIds = [otherUserId, userId]
    // Step 1: get chat IDs that have both users


const commonChats = await ChatUser.findAll({
  attributes: ['chat_id'],
  where: { user_id: { [Op.in]: userIds } },
  group: ['chat_id'],
  having: Sequelize.literal(`COUNT(DISTINCT user_id) = 2`)
});
const chatIds = commonChats.map(r => r.get('chat_id'));

// Step 2: get chat_id + user_id rows for those chatIds
const existingChats = await ChatUser.findAll({
  attributes: ['chat_id', 'user_id'],
  where: {
    chat_id: { [Op.in]: chatIds },
    user_id: { [Op.in]: [  otherUserId] }
  },
});
 
console.log('existing chats=>',existingChats)
    if (existingChats.length>0) {
      return res.status(200).json({id: existingChats[0].get("chat_id"), receiver: existingChats[0].get("user_id"),   chat_exists: true });
    }
    
//  Create a new chat
    const newChat = await Chat.create({ is_group: false });
    console.log(newChat)
    // Add participants
    await ChatUser.bulkCreate([
      { chat_id: newChat.id, user_id: userId },
      { chat_id: newChat.id, user_id: otherUserId },
    ]);

    return res.status(201).json("newChat");
  } catch (error) {   
    return res.status(500).json({ message: "Server error" });
  }
});

router.get('/:id', async (req, res) => {
  const chatId = req.params.id;
  const page = parseInt(req.query.page) || 1;    // e.g. ?page=2
  const limit = parseInt(req.query.limit) || 20; // e.g. ?limit=20
  const offset = (page - 1) * limit;
  console.log("=Fetching messages",chatId, page, limit, offset)
  try {
    // Fetch paginated messages for the chat
    const { count, rows  } = await Message.findAndCountAll({
      where: { chat_id: chatId },
      include: [
        {
          model: User,
          attributes: ["id", "username", "avatar"],
        },
      ],
      order: [["timestamp", "DESC"]], // get newest first
      limit,
      offset,
    });
    var messages = rows.reverse()  
    res.json({
      pagination:{
         totalMessages: count,
      totalPages: Math.ceil(count / limit),
      page: page,
      },
      messages, // already sorted newest → oldest
    });
  } catch (err) {
    console.error("❌ Fetch messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});


router.post('/:id/add-user', (req, res) => {
  res.send(`Add user to chat ${req.params.id}`);
});

module.exports = router;
