import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { Telegraf } from 'telegraf'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import db from './db'

// ============================================================================
// КОНФИГУРАЦИЯ БЕЗОПАСНОСТИ
// ============================================================================

const BOT_TOKEN = process.env.BOT_TOKEN
if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN') {
    console.error('❌ ERROR: BOT_TOKEN is not defined in environment variables or is using the default placeholder.')
    console.error('   Please copy backend/.env.example to backend/.env and set your bot token.')
    process.exit(1)
}

// Валидация токена — должен быть строкой и не содержать пробелов
if (typeof BOT_TOKEN !== 'string' || BOT_TOKEN.includes(' ') || BOT_TOKEN.length < 10) {
    console.error('❌ ERROR: BOT_TOKEN has invalid format. Must be a valid Telegram bot token.')
    process.exit(1)
}

const bot = new Telegraf(BOT_TOKEN)
const app = express()

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o: string) => o.trim())
    : ['http://localhost:3000']

// Валидация origins — только HTTPS в production
if (process.env.NODE_ENV === 'production') {
    const hasInsecure = allowedOrigins.some((origin: string) => 
        origin.startsWith('http://') && !origin.includes('localhost')
    )
    if (hasInsecure) {
        console.warn('⚠️  WARNING: Using HTTP origins in production. Consider using HTTPS.')
    }
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl)
        if (!origin) {
            // В production блокируем запросы без origin если не включено явно
            if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_NO_ORIGIN) {
                return callback(null, false)
            }
            return callback(null, true)
        }

        // Проверка протокола
        if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
            return callback(null, false)
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(null, false)
        }
    },
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}))

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet для security headers
app.use(helmet({
    contentSecurityPolicy: false, // Отключаем для API
    crossOriginEmbedderPolicy: false
}))

// Rate limiting — защита от DoS и brute force
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 минута
    max: 30, // 30 запросов в минуту
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Пропускаем health check
        return req.path === '/health'
    }
})
app.use('/api/', limiter)

// Более строгий rate limit для upload-midi
const uploadLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 минут
    max: 10, // 10 загрузок в 5 минут
    message: { error: 'Too many MIDI uploads, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
})

// ============================================================================
// ТЕЛЕГРАМ ВАЛИДАЦИЯ
// ============================================================================

/**
 * Validate initData from Telegram
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function validateInitData(initData: string, token: string): boolean {
    // Skip validation only in development mode with explicit flag
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_TELEGRAM_VALIDATION === 'true') {
        console.warn('⚠️  Skipping Telegram validation in development mode')
        return true
    }

    if (!initData || typeof initData !== 'string') {
        return false
    }

    try {
        const urlParams = new URLSearchParams(initData)
        const hash = urlParams.get('hash')
        
        if (!hash) return false
        
        urlParams.delete('hash')

        // Проверка auth_date — данные не старше 24 часов
        const authDate = parseInt(urlParams.get('auth_date') || '0', 10)
        if (!authDate) return false
        
        const now = Math.floor(Date.now() / 1000)
        const maxAge = parseInt(process.env.TELEGRAM_DATA_MAX_AGE || '86400', 10) // 24 часа по умолчанию
        
        if (now - authDate > maxAge) {
            console.warn(`⚠️  Telegram data expired: age=${now - authDate}s, max=${maxAge}s`)
            return false // Replay attack protection
        }

        // Сортировка ключей для проверки
        const sortKeys = Array.from(urlParams.keys()).sort()
        const dataCheckString = sortKeys
            .map(key => `${key}=${urlParams.get(key)}`)
            .join('\n')

        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest()
        const checkHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

        // Constant-time comparison для защиты от timing attacks
        const expectedHash = Buffer.from(hash, 'hex')
        const actualHash = Buffer.from(checkHash, 'hex')
        
        if (expectedHash.length !== actualHash.length) return false
        
        let result = 0
        for (let i = 0; i < expectedHash.length; i++) {
            result |= expectedHash[i] ^ actualHash[i]
        }
        
        return result === 0
    } catch (error) {
        console.error('Telegram validation error:', error instanceof Error ? error.message : String(error))
        return false
    }
}

/**
 * Извлечь userId из initData
 */
function getUserIdFromInitData(initData: string): number | null {
    try {
        const urlParams = new URLSearchParams(initData)
        const userStr = urlParams.get('user')
        if (userStr) {
            const user = JSON.parse(userStr)
            if (typeof user.id === 'number') {
                return user.id
            }
        }
    } catch (e) {
        console.error('Failed to parse user from initData:', e)
    }
    return null
}

// ============================================================================
// САНИТИЗАЦИЯ ИМЁН ФАЙЛОВ
// ============================================================================

// Зарезервированные имена Windows
const WINDOWS_RESERVED = new Set([
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
])

/**
 * Sanitize filename to prevent path traversal and malicious naming
 * @see CWE-022: Improper Limitation of a Pathname to a Restricted Directory
 */
function sanitizeFilename(filename: any): string {
    // Проверка на null/undefined
    if (filename == null || typeof filename !== 'string') {
        return 'generative_loop.mid'
    }

    // Проверка на пустую строку или только whitespace
    if (filename.trim() === '') {
        return 'generative_loop.mid'
    }

    // Проверка на null bytes (CWE-022)
    if (filename.includes('\0')) {
        console.warn('⚠️  Detected null byte in filename, rejecting')
        return 'generative_loop.mid'
    }

    // Извлекаем только имя файла, удаляя пути
    let base = path.basename(filename)

    // Проверка на пустое имя
    if (!base || base === '' || base === '.') {
        return 'generative_loop.mid'
    }

    // Проверка на зарезервированные имена Windows
    const nameWithoutExt = path.parse(base).name.toUpperCase()
    if (WINDOWS_RESERVED.has(nameWithoutExt)) {
        console.warn(`⚠️  Blocked Windows reserved filename: ${base}`)
        return 'generative_loop.mid'
    }

    // Удаляем все символы кроме alphanumeric, точек, подчёркиваний, дефисов
    let sanitized = base.replace(/[^a-zA-Z0-9._-]/g, '_')

    // Защита от скрытых файлов (начинающихся с точки)
    if (sanitized.startsWith('.')) {
        sanitized = 'file' + sanitized
    }

    // Проверка на пустое имя после санитизации
    if (!sanitized || sanitized === '' || sanitized === '_') {
        return 'generative_loop.mid'
    }

    // Принудительное расширение .mid
    if (!sanitized.toLowerCase().endsWith('.mid')) {
        // Удаляем другие расширения
        sanitized = sanitized.replace(/\.[^.]+$/, '') + '.mid'
    }

    // Ограничение длины (64 символа)
    const maxLength = 64
    if (sanitized.length > maxLength) {
        const ext = '.mid'
        const maxNameLength = maxLength - ext.length
        sanitized = sanitized.slice(0, maxNameLength) + ext
    }

    // Финальная проверка
    if (!sanitized || sanitized.length === 0) {
        return 'generative_loop.mid'
    }

    return sanitized
}

// ============================================================================
// ВАЛИДАЦИЯ РАЗМЕРА ДАННЫХ
// ============================================================================

const MAX_MIDI_SIZE_BASE64 = 1024 * 1024 // 1MB в base64 (~750KB бинарных данных)
const MIN_MIDI_SIZE_BASE64 = 100 // Минимум 100 символов

function validateMidiSize(base64Data: string): { valid: boolean; error?: string } {
    if (!base64Data || typeof base64Data !== 'string') {
        return { valid: false, error: 'MIDI data is required' }
    }

    // Проверка на valid base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (!base64Regex.test(base64Data)) {
        return { valid: false, error: 'Invalid base64 encoding' }
    }

    // Проверка размера
    if (base64Data.length < MIN_MIDI_SIZE_BASE64) {
        return { valid: false, error: 'MIDI file too small or corrupted' }
    }

    if (base64Data.length > MAX_MIDI_SIZE_BASE64) {
        return { valid: false, error: `MIDI file too large (max ${MAX_MIDI_SIZE_BASE64 / 1024 / 1024}MB)` }
    }

    return { valid: true }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    })
})

// ============================================================================
// UPLOAD MIDI — TELEGRAM BOT
// ============================================================================

app.post('/upload-midi', uploadLimiter, async (req: Request, res: Response) => {
    const { initData, midiBase64, filename } = req.body

    // Валидация Telegram initData
    if (!validateInitData(initData, BOT_TOKEN)) {
        console.warn('⚠️  Invalid Telegram authentication attempt')
        return res.status(403).json({ error: 'Invalid authentication' })
    }

    // Валидация размера MIDI
    const sizeValidation = validateMidiSize(midiBase64)
    if (!sizeValidation.valid) {
        return res.status(400).json({ error: sizeValidation.error })
    }

    // Извлечение userId
    const chatId = getUserIdFromInitData(initData)
    if (!chatId) {
        return res.status(400).json({ error: 'User ID not found in initData' })
    }

    // Санитизация имени файла
    const safeFilename = sanitizeFilename(filename)

    try {
        const buffer = Buffer.from(midiBase64, 'base64')

        // Дополнительная проверка размера буфера
        if (buffer.length > MAX_MIDI_SIZE_BASE64 * 0.75) {
            return res.status(400).json({ error: 'MIDI file too large' })
        }

        // Проверка MIDI заголовка (должен начинаться с 'MThd')
        if (buffer.length < 4 || buffer.toString('ascii', 0, 4) !== 'MThd') {
            console.warn('⚠️  Invalid MIDI file header')
            return res.status(400).json({ error: 'Invalid MIDI file format' })
        }

        await bot.telegram.sendDocument(chatId, {
            source: buffer,
            filename: safeFilename
        }, {
            caption: 'Твой MIDI луп готов! 🎹'
        })

        console.log(`✅ MIDI sent to user ${chatId}: ${safeFilename}`)
        res.json({ success: true })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('❌ Telegram bot error:', errorMessage)
        
        // Проверка на конкретные ошибки Telegram
        if (errorMessage.includes('chat not found') || errorMessage.includes('bot was blocked')) {
            return res.status(400).json({ error: 'Unable to send message. Please start a chat with the bot first.' })
        }
        
        res.status(500).json({ error: 'Failed to send MIDI to Telegram' })
    }
})

// ============================================================================
// PROJECTS API
// ============================================================================

// List projects (Leaderboard)
app.get('/api/projects', (req: Request, res: Response) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100) // Max 100
        const offset = Math.max(parseInt(req.query.offset as string) || 0, 0)
        
        if (limit < 1 || offset < 0) {
            return res.status(400).json({ error: 'Invalid pagination parameters' })
        }
        
        const projects = db.getProjects.all(limit, offset)
        res.json(projects)
    } catch (e) {
        console.error('Failed to list projects:', e)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

// Get single project
app.get('/api/projects/:id', (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10)
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid project ID' })
        }
        
        const project = db.getProjectById.get(id)
        if (!project) {
            return res.status(404).json({ error: 'Project not found' })
        }
        res.json(project)
    } catch (e) {
        console.error('Failed to get project:', e)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

// Create/Share project
app.post('/api/projects', (req: Request, res: Response) => {
    try {
        const { name, author, data, parent_id } = req.body
        
        // Валидация обязательных полей
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Project name is required' })
        }
        
        if (!data) {
            return res.status(400).json({ error: 'Project data is required' })
        }

        // Ограничение длины имени
        if (name.length > 100) {
            return res.status(400).json({ error: 'Project name too long (max 100 characters)' })
        }

        // Валидация author
        const safeAuthor = typeof author === 'string' && author.trim() !== '' 
            ? author.slice(0, 50) 
            : 'Anonymous'

        // Валидация parent_id
        const safeParentId = parent_id ? parseInt(parent_id, 10) : null

        const result = db.insertProject.run(name.trim(), safeAuthor, JSON.stringify(data), safeParentId)
        res.json({ success: true, id: result.lastInsertRowid })
    } catch (e) {
        console.error('Failed to save project:', e)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

// Like project
app.post('/api/projects/:id/like', (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10)
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid project ID' })
        }
        
        const result = db.incrementLikes.run(id)
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Project not found' })
        }
        res.json({ success: true })
    } catch (e) {
        console.error('Failed to like project:', e)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' })
})

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err)
    
    // Не раскрываем детали ошибок в production
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message
    
    res.status(500).json({ error: message })
})

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3001

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, shutting down gracefully...')
    bot.stop('SIGTERM')
    process.exit(0)
})

process.on('SIGINT', () => {
    console.log('👋 SIGINT received, shutting down gracefully...')
    bot.stop('SIGINT')
    process.exit(0)
})

app.listen(PORT, () => {
    console.log(`✅ Backend MIDI server running on port ${PORT}`)
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`   Health check: http://localhost:${PORT}/health`)
})
