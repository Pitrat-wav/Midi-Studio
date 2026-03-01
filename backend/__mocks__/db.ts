import Database from 'better-sqlite3';

const db = new Database(':memory:');

db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        author TEXT DEFAULT 'Anonymous',
        data TEXT NOT NULL,
        parent_id INTEGER,
        likes INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_hash TEXT,
        FOREIGN KEY (parent_id) REFERENCES projects(id) ON DELETE SET NULL
    )
`);

const insertProject = db.prepare(`
    INSERT INTO projects (name, author, data, parent_id)
    VALUES (?, ?, ?, ?)
`);

const getProjects = db.prepare(`
    SELECT id, name, author, parent_id, likes, created_at, updated_at
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
    insertProject: (name: string, author: string, data: string, parentId: number | null) => {
        const result = insertProject.run(name, author, data, parentId);
        return { lastInsertRowid: result.lastInsertRowid };
    },
    getProjects: (limit: number, offset: number) => {
        return getProjects.all(limit, offset);
    },
    getProjectById: (id: number) => {
        return getProjectById.get(id);
    },
    incrementLikes: (id: number) => {
        const result = incrementLikes.run(id);
        return { changes: result.changes };
    },
    getProjectsByAuthor: (author: string, limit: number = 20, offset: number = 0) => {
        return [];
    },
    deleteProject: (id: number) => {
        return { changes: 0 };
    },
    updateProject: (id: number, name: string, data: string) => {
        return { changes: 0 };
    },
    checkIntegrity: () => true,
    close: () => {
        db.close();
    }
};
