const express = require('express');
const router = express.Router();

// Placeholder routes
router.get('/', (req, res) => {
  res.send('Get all chats for logged-in user');
});

router.post('/', (req, res) => {
  res.send('Create a new chat');
});

router.get('/:id', (req, res) => {
  res.send(`Get chat ${req.params.id}`);
});

router.post('/:id/add-user', (req, res) => {
  res.send(`Add user to chat ${req.params.id}`);
});

module.exports = router;
