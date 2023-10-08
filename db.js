const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Path to the captured_packets.db file
const capturedPacketsDBPath = path.join(
  "C:",
  "Users",
  "Imesh",
  "Desktop",
  "IT20246396  Reserch",
  "backend-nd-dev",
  "captured_packets.db"
);

// Create a new SQLite database instance for captured_packets.db
const db = new sqlite3.Database(capturedPacketsDBPath);

// Define a schema for the 'packets' table
const createPacketsTableQuery = `
CREATE TABLE IF NOT EXISTS likes_dislikes (
  client_ip TEXT PRIMARY KEY,
  like BOOLEAN,
  dislike BOOLEAN
)

`;

// Define a schema for the 'likes_dislikes' table
const createLikesDislikesTableQuery = `
    CREATE TABLE IF NOT EXISTS likes_dislikes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        packet_id INTEGER,
        like BOOLEAN,
        dislike BOOLEAN
    )
`;

// Create the 'packets' table
db.run(createPacketsTableQuery, (err) => {
  if (err) {
    console.error("Error creating 'packets' table:", err.message);
  } else {
    console.log("'packets' table created or already exists");
  }
});

// Create the 'likes_dislikes' table
db.run(createLikesDislikesTableQuery, (err) => {
  if (err) {
    console.error("Error creating 'likes_dislikes' table:", err.message);
  } else {
    console.log("'likes_dislikes' table created or already exists");
  }
});

// Path to the detected_vulnerabilities.db file
const detectedVulnerabilitiesDBPath = path.join(
  "C:",
  "Users",
  "Imesh",
  "Desktop",
  "IT20246396  Reserch",
  "backend-nd-dev",
  "detected_vulnerabilities.db"
);

// Create a new SQLite database instance for detected_vulnerabilities.db
const detectedVulnerabilitiesDB = new sqlite3.Database(
  detectedVulnerabilitiesDBPath
);

// Define a schema for the 'sqlite_sequence' table (if needed)
const createSqliteSequenceTableQuery = `
    CREATE TABLE IF NOT EXISTS sqlite_sequence (
        name TEXT,
        seq INTEGER
    )
`;

// Create the 'sqlite_sequence' table (if needed)
detectedVulnerabilitiesDB.run(createSqliteSequenceTableQuery, (err) => {
  if (err) {
    console.error("Error creating 'sqlite_sequence' table:", err.message);
  } else {
    console.log("'sqlite_sequence' table created or already exists");
  }
});

// Define a schema for the 'vulnerabilities' table
const createVulnerabilitiesTableQuery = `
    CREATE TABLE IF NOT EXISTS vulnerabilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    protocol TEXT,
    source TEXT,
    destination TEXT,
    vulnerability_info REAL
)
`;

// Create the 'vulnerabilities' table
detectedVulnerabilitiesDB.run(createVulnerabilitiesTableQuery, (err) => {
  if (err) {
    console.error("Error creating 'vulnerabilities' table:", err.message);
  } else {
    console.log("'vulnerabilities' table created or already exists");
  }
});

// Export the SQLite database instances
module.exports = {
  capturedPacketsDB: db,
  detectedVulnerabilitiesDB: detectedVulnerabilitiesDB,
};
