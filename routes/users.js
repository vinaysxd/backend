const express = require('express');
const router = express.Router();

// Placeholder routes
router.get('/', (req, res) => {
  res.send('Get all users');
});

router.get('/:id', (req, res) => {
  res.send(`Get user ${req.params.id}`);
});

router.put('/:id', (req, res) => {
  res.send(`Update user ${req.params.id}`);
});

module.exports = router;
