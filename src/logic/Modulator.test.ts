import { test, describe } from 'node:test'
import assert from 'node:assert'
import { Modulator } from './Modulator.ts'

describe('Modulator', () => {
    const assertClose = (actual: number, expected: number, epsilon: number = 0.000001) => {
        assert.ok(Math.abs(actual - expected) < epsilon, `Expected ${actual} to be close to ${expected}`)
    }

    test('sine wave generation', () => {
        const modulator = new Modulator()
        // Phase 0: sin(0) = 0
        assertClose(modulator.getNextValue('sine', 1, 0), Math.sin(0))

        // Phase 0.25: sin(pi/2) = 1
        assertClose(modulator.getNextValue('sine', 1, 0.25), Math.sin(0.25 * Math.PI * 2))

        // Phase 0.5: sin(pi) = 0
        assertClose(modulator.getNextValue('sine', 1, 0.25), Math.sin(0.5 * Math.PI * 2))

        // Phase 0.75: sin(3pi/2) = -1
        assertClose(modulator.getNextValue('sine', 1, 0.25), Math.sin(0.75 * Math.PI * 2))
    })

    test('triangle wave generation', () => {
        const modulator = new Modulator()
        // formula: 1 - Math.abs((this.phase * 2) - 1) * 2

        // Phase 0: 1 - |0-1|*2 = -1
        assertClose(modulator.getNextValue('triangle', 1, 0), -1)

        // Phase 0.25: 1 - |0.5-1|*2 = 1 - 0.5*2 = 0
        assertClose(modulator.getNextValue('triangle', 1, 0.25), 0)

        // Phase 0.5: 1 - |1-1|*2 = 1
        assertClose(modulator.getNextValue('triangle', 1, 0.25), 1)

        // Phase 0.75: 1 - |1.5-1|*2 = 0
        assertClose(modulator.getNextValue('triangle', 1, 0.25), 0)

        // Phase 1.0 (wraps to 0): -1
        assertClose(modulator.getNextValue('triangle', 1, 0.25), -1)
    })

    test('saw wave generation', () => {
        const modulator = new Modulator()
        // formula: (this.phase * 2) - 1

        // Phase 0: -1
        assertClose(modulator.getNextValue('saw', 1, 0), -1)

        // Phase 0.25: 0.5 - 1 = -0.5
        assertClose(modulator.getNextValue('saw', 1, 0.25), -0.5)

        // Phase 0.5: 1 - 1 = 0
        assertClose(modulator.getNextValue('saw', 1, 0.25), 0)

        // Phase 0.75: 1.5 - 1 = 0.5
        assertClose(modulator.getNextValue('saw', 1, 0.25), 0.5)
    })

    test('square wave generation', () => {
        const modulator = new Modulator()
        // formula: phase < 0.5 ? 1 : -1

        // Phase 0: 1
        assert.strictEqual(modulator.getNextValue('square', 1, 0), 1)

        // Phase 0.25: 1
        assert.strictEqual(modulator.getNextValue('square', 1, 0.25), 1)

        // Phase 0.5: -1 (because 0.5 is not < 0.5)
        assert.strictEqual(modulator.getNextValue('square', 1, 0.25), -1)

        // Phase 0.75: -1
        assert.strictEqual(modulator.getNextValue('square', 1, 0.25), -1)
    })

    test('phase wrap-around', () => {
        const modulator = new Modulator()
        // Frequency 1, Delta 0.6 -> Phase 0.6
        modulator.getNextValue('saw', 1, 0.6)
        // Frequency 1, Delta 0.6 -> Phase 1.2 -> Wraps to 0.2
        const val = modulator.getNextValue('saw', 1, 0.6)
        assertClose(val, (0.2 * 2) - 1)
    })

    test('random wave range', () => {
        const modulator = new Modulator()
        for (let i = 0; i < 100; i++) {
            const val = modulator.getNextValue('random', 10, 0.1)
            assert.ok(val >= -1 && val <= 1)
        }
    })

    test('frequency 0 result in constant phase', () => {
        const modulator = new Modulator()
        modulator.getNextValue('saw', 1, 0.5) // Phase 0.5, returns 0
        const val1 = modulator.getNextValue('saw', 0, 0.1)
        const val2 = modulator.getNextValue('saw', 0, 0.1)
        assert.strictEqual(val1, 0)
        assert.strictEqual(val2, 0)
    })

    test('delta 0 result in constant phase', () => {
        const modulator = new Modulator()
        modulator.getNextValue('saw', 1, 0.5) // Phase 0.5, returns 0
        const val1 = modulator.getNextValue('saw', 1, 0)
        const val2 = modulator.getNextValue('saw', 1, 0)
        assert.strictEqual(val1, 0)
        assert.strictEqual(val2, 0)
    })

    test('default case returns 0', () => {
        const modulator = new Modulator()
        // testing invalid input by casting to any
        assert.strictEqual(modulator.getNextValue('invalid' as any, 1, 0.5), 0)
    })
})
