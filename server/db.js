const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const fs = require('fs');

const file = path.join(__dirname, 'data', 'db.json');
fs.mkdirSync(path.dirname(file), { recursive: true });

const adapter = new JSONFile(file);
const db = new Low(adapter);

async function init() {
  await db.read();
  db.data ||= { users: [], documents: [], teams: [], nextId: 1 };
  // Seed an admin, judge and notary for testing
  if (db.data.users.length === 0) {
    db.data.users.push(
      { id: 1, email: 'admin@local', name: 'Administrador', role: 'admin', password: 'admin' },
      { id: 2, email: 'judge@local', name: 'Juez', role: 'judge', password: 'judge' },
      { id: 3, email: 'notary@local', name: 'Notario', role: 'notary', password: 'notary' }
    );
  }
  await db.write();
}

module.exports = { db, init };
