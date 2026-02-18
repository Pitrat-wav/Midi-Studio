import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'projects.db'));

// Initialize projects table
db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        author TEXT DEFAULT 'Anonymous',
        data TEXT NOT NULL,
        parent_id INTEGER,
        likes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Prepare statements for performance
const insertProject = db.prepare(`
    INSERT INTO projects (name, author, data, parent_id)
    VALUES (?, ?, ?, ?)
`);

const getProjects = db.prepare(`
    SELECT id, name, author, parent_id, likes, created_at 
    FROM projects 
    ORDER BY likes DESC, created_at DESC 
    LIMIT ? OFFSET ?
`);

const getProjectById = db.prepare(`
    SELECT * FROM projects WHERE id = ?
`);

const incrementLikes = db.prepare(`
    UPDATE projects SET likes = likes + 1 WHERE id = ?
`);

export default {
    insertProject,
    getProjects,
    getProjectById,
    incrementLikes
};
