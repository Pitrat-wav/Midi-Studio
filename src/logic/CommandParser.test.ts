import { test, describe } from 'node:test'
import assert from 'node:assert'
import { parseCommand } from './CommandParser'

describe('CommandParser', () => {
    test('help command returns list of available commands', () => {
        const response = parseCommand('help')
        assert.strictEqual(response.success, true)
        assert.ok(response.message.includes('Доступные команды'))
        assert.ok(response.message.includes('bpm'))
        assert.ok(response.message.includes('play'))
        assert.ok(response.message.includes('stop'))
        assert.ok(response.message.includes('bass.cutoff'))
    })

    test('unknown command returns error', () => {
        const response = parseCommand('unknown_command')
        assert.strictEqual(response.success, false)
        assert.ok(response.message.includes('Неизвестная команда'))
    })

    test('empty input returns error', () => {
        const response = parseCommand('')
        assert.strictEqual(response.success, false)
        assert.strictEqual(response.message, '')
    })

    test('bpm command without args returns current bpm', () => {
        // This will test if the store is accessible in the test environment
        const response = parseCommand('bpm')
        assert.strictEqual(response.success, false)
        assert.ok(response.message.includes('Текущий BPM'))
    })

    test('bpm command with invalid arg returns error', () => {
        const response = parseCommand('bpm invalid')
        assert.strictEqual(response.success, false)
        assert.ok(response.message.includes('BPM должен быть числом'))
    })
})
