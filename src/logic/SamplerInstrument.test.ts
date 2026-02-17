import { test, describe, mock } from 'node:test'
import assert from 'node:assert'

// Mock Tone.js before importing SamplerInstrument
mock.module('tone', {
    namedExports: {
        GrainPlayer: class {
            connect() { return this }
            dispose() {}
            volume = { value: 0 }
            buffer = {}
            grainSize = 0.1
            overlap = 0.1
            playbackRate = 1
            detune = 0
            start() {}
        },
        Volume: class {
            volume = { rampTo: () => {}, value: 0 }
            connect() { return this }
            dispose() {}
        },
        ToneAudioBuffer: class {
            duration = 1
            load(url: string) {
                return Promise.resolve(this)
            }
        },
        now: () => 0
    }
})

// Use a dynamic import to ensure the mock is registered before SamplerInstrument is loaded
const { SamplerInstrument } = await import('./SamplerInstrument.ts')

describe('SamplerInstrument', () => {
    test('initial state', () => {
        const sampler = new SamplerInstrument()
        assert.strictEqual(sampler.url, '')
        assert.strictEqual(sampler.loaded, false)
    })

    test('load() updates url and loaded state', async () => {
        const sampler = new SamplerInstrument()
        await sampler.load('test.mp3')
        assert.strictEqual(sampler.url, 'test.mp3')
        assert.strictEqual(sampler.loaded, true)
    })

    test('load() skips if URL is already loaded', async () => {
        const sampler = new SamplerInstrument()
        await sampler.load('same.mp3')
        assert.strictEqual(sampler.loaded, true)

        // Manually set loaded to false to verify skip
        sampler.loaded = false
        await sampler.load('same.mp3')

        // If it skipped, it didn't set loaded = true
        assert.strictEqual(sampler.loaded, false)
        assert.strictEqual(sampler.url, 'same.mp3')
    })
})
