const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./chat.db', (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Database connected');
});

module.exports = db;