const db = require('better-sqlite3')('data.db');
db.exec(`CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  clipId TEXT NOT NULL,
  userId TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt INTEGER DEFAULT (strftime('%s', 'now'))
)`);
console.log('Comments table created');
