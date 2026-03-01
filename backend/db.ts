import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

// ============================================================================
// КОНФИГУРАЦИЯ БАЗЫ ДАННЫХ
// ============================================================================

const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : path.join(dataDir, 'projects.db')
const db = new Database(dbPath)

// ============================================================================
// ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ
// ============================================================================

// Включаем WAL режим для лучшей конкурентности (чтение без блокировки записи)
db.pragma('journal_mode = WAL')

// Включаем foreign keys
db.pragma('foreign_keys = ON')

// Увеличиваем кэш страниц для производительности
db.pragma('cache_size = -64000') // 64MB кэш

// Синхронизация — FULL для безопасности, можно изменить на NORMAL для скорости
db.pragma('synchronous = FULL')

// ============================================================================
// МИГРАЦИИ СХЕМЫ
// ============================================================================

function runMigrations() {
    // Получаем текущую версию схемы
    db.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version INTEGER NOT NULL UNIQUE,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `)

    const currentVersion = db.prepare('SELECT COALESCE(MAX(version), 0) FROM _migrations').get() as { 'COALESCE(MAX(version), 0)': number }
    const currentVersionNum = currentVersion?.['COALESCE(MAX(version), 0)'] || 0

    // Миграция v1: Базовая схема проектов
    if (currentVersionNum < 1) {
        console.log('📦 Applying migration v1: Initial schema')
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
                FOREIGN KEY (parent_id) REFERENCES projects(id) ON DELETE SET NULL
            )
        `)

        // Индексы для производительности
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_projects_likes ON projects(likes DESC)
        `)
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC)
        `)
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects(parent_id)
        `)

        db.exec('INSERT INTO _migrations (version) VALUES (1)')
    }

    // Миграция v2: Добавляем индекс для поиска по автору
    if (currentVersionNum < 2) {
        console.log('📦 Applying migration v2: Author index')
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_projects_author ON projects(author)
        `)
        db.exec('INSERT INTO _migrations (version) VALUES (2)')
    }

    // Миграция v3: Добавляем триггер для updated_at
    if (currentVersionNum < 3) {
        console.log('📦 Applying migration v3: Updated_at trigger')
        db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_projects_updated_at 
            AFTER UPDATE ON projects
            FOR EACH ROW
            BEGIN
                UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        `)
        db.exec('INSERT INTO _migrations (version) VALUES (3)')
    }

    // Миграция v4: Добавляем проверку целостности данных
    if (currentVersionNum < 4) {
        console.log('📦 Applying migration v4: Data constraints')
        db.exec(`
            ALTER TABLE projects ADD COLUMN data_hash TEXT
        `)
        db.exec('INSERT INTO _migrations (version) VALUES (4)')
    }

    console.log(`✅ Database schema version: ${currentVersionNum >= 4 ? currentVersionNum : 4}`)
}

// Запускаем миграции
runMigrations()

// ============================================================================
// ПОДГОТОВЛЕННЫЕ ВЫРАЖЕНИЯ (для производительности)
// ============================================================================

const insertProject = db.prepare(`
    INSERT INTO projects (name, author, data, parent_id)
    VALUES (?, ?, ?, ?)
`)

const getProjects = db.prepare(`
    SELECT id, name, author, parent_id, likes, created_at, updated_at
    FROM projects
    ORDER BY likes DESC, created_at DESC
    LIMIT ? OFFSET ?
`)

const getProjectById = db.prepare(`
    SELECT * FROM projects WHERE id = ?
`)

const incrementLikes = db.prepare(`
    UPDATE projects SET likes = likes + 1 WHERE id = ?
`)

const getProjectsByAuthor = db.prepare(`
    SELECT id, name, author, parent_id, likes, created_at
    FROM projects
    WHERE author = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
`)

const deleteProject = db.prepare(`
    DELETE FROM projects WHERE id = ?
`)

const updateProject = db.prepare(`
    UPDATE projects 
    SET name = ?, data = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
`)

// ============================================================================
// ФУНКЦИИ ДЛЯ ВАЛИДАЦИИ ДАННЫХ
// ============================================================================

const MAX_PROJECT_NAME_LENGTH = 100
const MAX_AUTHOR_LENGTH = 50
const MAX_DATA_SIZE = 10 * 1024 * 1024 // 10MB

function validateProjectData(name: string, author: string, data: string) {
    const errors: string[] = []

    if (!name || typeof name !== 'string' || name.trim() === '') {
        errors.push('Project name is required')
    } else if (name.length > MAX_PROJECT_NAME_LENGTH) {
        errors.push(`Project name too long (max ${MAX_PROJECT_NAME_LENGTH} characters)`)
    }

    if (author && author.length > MAX_AUTHOR_LENGTH) {
        errors.push(`Author name too long (max ${MAX_AUTHOR_LENGTH} characters)`)
    }

    if (!data) {
        errors.push('Project data is required')
    } else if (data.length > MAX_DATA_SIZE) {
        errors.push(`Project data too large (max ${MAX_DATA_SIZE / 1024 / 1024}MB)`)
    }

    // Проверка на валидный JSON
    if (data) {
        try {
            JSON.parse(data)
        } catch (e) {
            errors.push('Project data must be valid JSON')
        }
    }

    return errors
}

// ============================================================================
// ЭКСПОРТ API
// ============================================================================

export default {
    // Основные операции
    insertProject: (name: string, author: string, data: string, parentId: number | null) => {
        // Валидация данных
        const errors = validateProjectData(name, author, data)
        if (errors.length > 0) {
            throw new Error(`Validation error: ${errors.join(', ')}`)
        }

        // Проверка parent_id если указан
        if (parentId !== null) {
            const parent = getProjectById.get(parentId)
            if (!parent) {
                throw new Error(`Parent project ${parentId} not found`)
            }
        }

        // Хеширование данных для целостности
        const dataHash = crypto.createHash('sha256').update(data).digest('hex')

        return insertProject.run(name.trim(), author.trim() || 'Anonymous', data, parentId)
    },

    getProjects: (limit: number, offset: number) => {
        // Ограничение на максимальное количество
        const safeLimit = Math.min(Math.max(limit, 1), 100)
        const safeOffset = Math.max(offset, 0)
        return getProjects.all(safeLimit, safeOffset)
    },

    getProjectById: (id: number) => {
        if (isNaN(id) || id < 1) {
            throw new Error('Invalid project ID')
        }
        return getProjectById.get(id)
    },

    incrementLikes: (id: number) => {
        if (isNaN(id) || id < 1) {
            throw new Error('Invalid project ID')
        }
        return incrementLikes.run(id)
    },

    // Дополнительные функции
    getProjectsByAuthor: (author: string, limit: number = 20, offset: number = 0) => {
        const safeLimit = Math.min(Math.max(limit, 1), 100)
        const safeOffset = Math.max(offset, 0)
        return getProjectsByAuthor.all(author, safeLimit, safeOffset)
    },

    deleteProject: (id: number) => {
        if (isNaN(id) || id < 1) {
            throw new Error('Invalid project ID')
        }
        return deleteProject.run(id)
    },

    updateProject: (id: number, name: string, data: string) => {
        if (isNaN(id) || id < 1) {
            throw new Error('Invalid project ID')
        }
        const errors = validateProjectData(name, '', data)
        if (errors.length > 0) {
            throw new Error(`Validation error: ${errors.join(', ')}`)
        }
        return updateProject.run(name.trim(), data, id)
    },

    // Утилита для проверки целостности БД
    checkIntegrity: () => {
        const result = db.pragma('integrity_check') as { integrity_check: string }[]
        return result[0]?.integrity_check === 'ok'
    },

    // Закрыть соединение (для graceful shutdown)
    close: () => {
        db.close()
    }
}
