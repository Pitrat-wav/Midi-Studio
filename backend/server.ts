import express, { Request, Response } from 'express'
import cors from 'cors'
import { Telegraf } from 'telegraf'
import crypto from 'crypto'
import path from 'path'

// В продакшене используйте переменные окружения
const BOT_TOKEN = process.env.BOT_TOKEN
if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN') {
    console.error('ERROR: BOT_TOKEN is not defined in environment variables or is using the default placeholder.')
    process.exit(1)
}
const bot = new Telegraf(BOT_TOKEN)
const app = express()

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json({ limit: '10mb' }))

/**
 * Validate initData from Telegram (required for launch)
 */
function validateInitData(initData: string, token: string): boolean {
    // Skip validation only in development mode
    if (process.env.NODE_ENV === 'development') return true

    if (!initData) return false

    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    urlParams.delete('hash')

    const sortKeys = Array.from(urlParams.keys()).sort()
    const dataCheckString = sortKeys.map(key => `${key}=${urlParams.get(key)}`).join('\n')

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest()
    const checkHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

    return checkHash === hash
}

/**
 * Sanitize filename to prevent path traversal and malicious naming
 */
function sanitizeFilename(filename: any): string {
    if (!filename || typeof filename !== 'string') {
        return 'generative_loop.mid'
    }

    // Extract only the filename part, removing any path components
    // path.basename is platform-dependent, but we also filter out unsafe characters
    const base = path.basename(filename)

    // Remove characters that aren't alphanumeric, dots, underscores, or dashes
    let sanitized = base.replace(/[^a-zA-Z0-9._-]/g, '_')

    // Ensure the filename is not empty and doesn't start with a dot (hidden file)
    if (!sanitized || sanitized.startsWith('.')) {
        sanitized = 'loop_' + sanitized.replace(/^\.+/, '')
    }

    // Final check for empty or just 'loop_'
    if (sanitized === 'loop_' || !sanitized) {
        sanitized = 'loop_unnamed'
    }

    // Ensure it has a .mid extension
    if (!sanitized.toLowerCase().endsWith('.mid')) {
        sanitized += '.mid'
    }

    // Limit length to a reasonable 64 characters
    if (sanitized.length > 64) {
        // Keep the extension if possible by slicing from the end or just truncating
        // For simplicity, we just slice the last 64 chars
        sanitized = sanitized.slice(-64)
    }

    return sanitized
}

app.post('/upload-midi', async (req: Request, res: Response) => {
    const { initData, midiBase64, filename } = req.body

    if (!validateInitData(initData, BOT_TOKEN)) {
        return res.status(403).send({ error: 'Invalid authentication' })
    }

    let chatId: number | null = null
    try {
        const urlParams = new URLSearchParams(initData)
        const userStr = urlParams.get('user')
        if (userStr) {
            const user = JSON.parse(userStr)
            chatId = user.id
        }
    } catch (e) {
        return res.status(400).send({ error: 'Malformed user data' })
    }

    if (!chatId) return res.status(400).send({ error: 'User ID not found' })

    try {
        const buffer = (Buffer as any).from(midiBase64, 'base64')
        const safeFilename = sanitizeFilename(filename)

        await bot.telegram.sendDocument(chatId, {
            source: buffer,
            filename: safeFilename
        }, {
            caption: 'Твой MIDI луп готов! 🎹'
        })

        res.send({ success: true })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Ошибка Бота:', errorMessage)
        res.status(500).send({ error: 'Не удалось отправить MIDI' })
    }
})

const PORT = (process as any).env.PORT || 3001
app.listen(PORT, () => console.log(`Backend MIDI server running on port ${PORT}`))
