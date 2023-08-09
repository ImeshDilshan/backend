const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database('captured_packets.db');

// Define a schema and create a table (you can modify this based on your requirements)
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS captured_packets (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
        protocol TEXT,
         source TEXT,
          destination TEXT,
        length INTEGER
    )
`;

db.run(createTableQuery, err => {
    if (err) {
        console.error("Error creating table:", err.message);
    } else {
        console.log("Table 'captured_packets' created or already exists");
    }
});

// Export the SQLite database instance
module.exports = db;
