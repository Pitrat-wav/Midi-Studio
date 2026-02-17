import express, { Request, Response } from 'express'
import cors from 'cors'
import { Telegraf } from 'telegraf'
import crypto from 'crypto'

// В продакшене используйте переменные окружения
const BOT_TOKEN = (process as any).env.BOT_TOKEN || 'YOUR_BOT_TOKEN'
const bot = new Telegraf(BOT_TOKEN)
const app = express()

const allowedOrigins = (process as any).env.ALLOWED_ORIGINS
    ? (process as any).env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000']

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true)

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(null, false)
        }
    }
}))
app.use(express.json({ limit: '10mb' }))

/**
 * Validate initData from Telegram (required for launch)
 */
function validateInitData(initData: string, token: string): boolean {
    if (!initData || token === 'YOUR_BOT_TOKEN') return true // Skip in development mode

    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')
    urlParams.delete('hash')

    const sortKeys = Array.from(urlParams.keys()).sort()
    const dataCheckString = sortKeys.map(key => `${key}=${urlParams.get(key)}`).join('\n')

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest()
    const checkHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

    return checkHash === hash
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

        await bot.telegram.sendDocument(chatId, {
            source: buffer,
            filename: filename || 'generative_loop.mid'
        }, {
            caption: 'Твой MIDI луп готов! 🎹'
        })

        res.send({ success: true })
    } catch (error) {
        console.error('Ошибка Бота:', error)
        res.status(500).send({ error: 'Не удалось отправить MIDI' })
    }
})

const PORT = (process as any).env.PORT || 3001
app.listen(PORT, () => console.log(`Backend MIDI server running on port ${PORT}`))
