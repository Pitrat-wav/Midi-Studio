import { test, describe, before, after, it } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import { app, bot } from './server'

// Mock database
import dbMock from './__mocks__/db'

// Helper to bypass Telegram validation for certain tests
process.env.SKIP_TELEGRAM_VALIDATION = 'true'
process.env.NODE_ENV = 'development'

describe('Backend API', () => {
    describe('GET /health', () => {
        it('should return 200 and status ok', async () => {
            const res = await request(app).get('/health')
            assert.strictEqual(res.status, 200)
            assert.strictEqual(res.body.status, 'ok')
            assert.ok(res.body.timestamp)
        })
    })

    describe('Projects API', () => {
        it('should create a new project', async () => {
            const projectData = {
                name: 'Test Project',
                author: 'Tester',
                data: { nodes: [], edges: [] }
            }
            const res = await request(app)
                .post('/api/projects')
                .send(projectData)

            assert.strictEqual(res.status, 200)
            assert.strictEqual(res.body.success, true)
            assert.ok(res.body.id)
        })

        it('should list projects', async () => {
            const res = await request(app).get('/api/projects')
            assert.strictEqual(res.status, 200)
            assert.ok(Array.isArray(res.body))
            assert.ok(res.body.length >= 1)
        })

        it('should get a project by id', async () => {
            const res = await request(app).get('/api/projects/1')
            assert.strictEqual(res.status, 200)
            assert.strictEqual(res.body.id, 1)
            assert.strictEqual(res.body.name, 'Test Project')
        })

        it('should return 404 for non-existent project', async () => {
            const res = await request(app).get('/api/projects/999')
            assert.strictEqual(res.status, 404)
        })

        it('should like a project', async () => {
            const res = await request(app).post('/api/projects/1/like')
            assert.strictEqual(res.status, 200)
            assert.strictEqual(res.body.success, true)
        })

        it('should return 400 for invalid project creation', async () => {
            const res = await request(app)
                .post('/api/projects')
                .send({ name: '' })
            assert.strictEqual(res.status, 400)
        })
    })

    describe('MIDI Upload API', () => {
        it('should fail without authentication', async () => {
            // Restore production-like behavior for this test
            const originalNodeEnv = process.env.NODE_ENV
            const originalSkip = process.env.SKIP_TELEGRAM_VALIDATION
            process.env.NODE_ENV = 'production'
            process.env.SKIP_TELEGRAM_VALIDATION = 'false'

            const res = await request(app)
                .post('/upload-midi')
                .send({
                    midiBase64: 'TVRoZAAAAAYAAQADAGBNVHJrAAAAGAD/WAQEAhgIAP9RAwc00KAA/y8ATVRyawAAABcA/1EDBzTQoAD/UQMHNNCgAP8vAE1UcmsAAAAXAP9RAwc00KAA/1EDBzTQoAD/LwA=',
                    filename: 'test.mid'
                })

            assert.strictEqual(res.status, 403)

            process.env.NODE_ENV = originalNodeEnv
            process.env.SKIP_TELEGRAM_VALIDATION = originalSkip
        })

        it('should succeed with valid MIDI and skipped validation', async () => {
            // Mock bot.telegram.sendDocument
            const originalSendDocument = bot.telegram.sendDocument
            bot.telegram.sendDocument = async () => ({}) as any

            const res = await request(app)
                .post('/upload-midi')
                .send({
                    initData: 'user=%7B%22id%22%3A12345%7D&hash=dummy',
                    midiBase64: 'TVRoZAAAAAYAAQADAGBNVHJrAAAAGAD/WAQEAhgIAP9RAwc00KAA/y8ATVRyawAAABcA/1EDBzTQoAD/UQMHNNCgAP8vAE1UcmsAAAAXAP9RAwc00KAA/1EDBzTQoAD/LwA=',
                    filename: 'test.mid'
                })

            assert.strictEqual(res.status, 200)
            assert.strictEqual(res.body.success, true)

            bot.telegram.sendDocument = originalSendDocument
        })

        it('should return 400 for invalid MIDI format', async () => {
            const res = await request(app)
                .post('/upload-midi')
                .send({
                    initData: 'user=%7B%22id%22%3A12345%7D&hash=dummy',
                    midiBase64: Buffer.from('this is definitely not a midi file but it must be long enough to pass size validation which is one hundred characters minimum so i am adding more text here to reach that limit').toString('base64'),
                    filename: 'test.mid'
                })

            assert.strictEqual(res.status, 400)
            assert.ok(res.body.error.includes('Invalid MIDI'))
        })
    })

    describe('Security Headers', () => {
        it('should have helmet security headers', async () => {
            const res = await request(app).get('/health')
            assert.ok(res.headers['x-dns-prefetch-control'])
            assert.ok(res.headers['x-frame-options'])
            assert.ok(res.headers['x-content-type-options'])
        })
    })

    describe('404 Handler', () => {
        it('should return 404 for unknown routes', async () => {
            const res = await request(app).get('/unknown-route')
            assert.strictEqual(res.status, 404)
            assert.strictEqual(res.body.error, 'Not Found')
        })
    })
})
