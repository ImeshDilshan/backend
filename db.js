const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join("C:", "Users", "Imesh", "Downloads" , "captured_packets.db");
const db = new sqlite3.Database(dbPath);

// Define a schema and create a table (you can modify this based on your requirements)
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS packets (
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
