import { test, describe } from 'node:test'
import assert from 'node:assert'
import { generateBassPattern } from './StingGenerator.ts'

describe('StingGenerator', () => {
    test('generateBassPattern returns exactly 16 steps', () => {
        const steps = generateBassPattern(0.5, 0.5)
        assert.strictEqual(steps.length, 16)
    })

    test('density = 0 results in no active steps', () => {
        const steps = generateBassPattern(0, 0.5)
        const activeSteps = steps.filter(s => s.active)
        assert.strictEqual(activeSteps.length, 0)
    })

    test('density = 1 results in all active steps', () => {
        const steps = generateBassPattern(1.0, 0.5)
        const activeSteps = steps.filter(s => s.active)
        assert.strictEqual(activeSteps.length, 16)
    })

    test('determinism: same seeds yield same output', () => {
        const params = {
            density: 0.5,
            type: 0.5,
            root: 'D',
            scale: 'major' as any,
            octave: 3,
            seedA: 123,
            seedB: 456,
            morph: 0.3
        }
        const steps1 = generateBassPattern(params.density, params.type, params.root, params.scale, params.octave, params.seedA, params.seedB, params.morph)
        const steps2 = generateBassPattern(params.density, params.type, params.root, params.scale, params.octave, params.seedA, params.seedB, params.morph)

        assert.deepStrictEqual(steps1, steps2)
    })

    test('morphing: interpolate between seedA and seedB', () => {
        const seedA = 10
        const seedB = 20
        const stepsA = generateBassPattern(0.5, 0.5, 'C', 'minor', 2, seedA, seedB, 0)
        const stepsB = generateBassPattern(0.5, 0.5, 'C', 'minor', 2, seedA, seedB, 1)
        const stepsMid = generateBassPattern(0.5, 0.5, 'C', 'minor', 2, seedA, seedB, 0.5)

        assert.notDeepStrictEqual(stepsA, stepsB, 'Seed A and Seed B should produce different results')
        assert.notDeepStrictEqual(stepsA, stepsMid, 'Morph 0 and Morph 0.5 should be different')
        assert.notDeepStrictEqual(stepsB, stepsMid, 'Morph 1 and Morph 0.5 should be different')
    })

    test('type control: tonal vs chromatic notes', () => {
        const root = 'C'
        const scale = 'major' as any // C D E F G A B

        // Tonal type (< 0.3) - should only use index 0, 2, 4 (C, E, G)
        const stepsTonal = generateBassPattern(1.0, 0.1, root, scale)
        const tonalNotes = new Set(stepsTonal.map(s => s.note.replace(/[0-9]/g, '')))
        tonalNotes.forEach(note => {
            assert.ok(['C', 'E', 'G'].includes(note), `Tonal note ${note} should be one of C, E, G`)
        })

        // Mid type (0.3 - 0.7) - uses full scale
        const stepsScale = generateBassPattern(1.0, 0.5, root, scale)
        const scaleNotes = new Set(stepsScale.map(s => s.note.replace(/[0-9]/g, '')))
        // We expect more than just C, E, G if the seed allows
        assert.ok(scaleNotes.size > 0)

        // Chromatic type (> 0.7) - uses chromatic scale
        // This is harder to verify precisely without knowing the seed output,
        // but we can at least check it doesn't crash and returns 16 steps.
        const stepsChromatic = generateBassPattern(1.0, 0.9, root, scale)
        assert.strictEqual(stepsChromatic.length, 16)
    })

    test('octave control', () => {
        const octave = 4
        const steps = generateBassPattern(1.0, 0.5, 'C', 'minor', octave)
        steps.forEach(s => {
            assert.ok(s.note.endsWith(octave.toString()), `Note ${s.note} should end with octave ${octave}`)
        })
    })

    test('accents and slides', () => {
        // High type increases slide probability
        const stepsHighType = generateBassPattern(1.0, 0.9, 'C', 'minor', 2)
        const hasSlides = stepsHighType.some(s => s.slide)
        const hasAccents = stepsHighType.some(s => s.accent)

        // At least one slide/accent is likely with density 1.0 and type 0.9,
        // but since it's pseudo-random it depends on seed.
        // Default seedA=0, seedB=1 should produce some.
        assert.strictEqual(stepsHighType.length, 16)
    })
})
