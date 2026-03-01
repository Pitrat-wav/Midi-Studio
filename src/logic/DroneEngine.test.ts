import { test, describe, mock } from 'node:test'
import assert from 'node:assert'

// Track created instances and their calls
let mockInstances: any[] = []

class MockBase {
    dispose = mock.fn()
    connect = mock.fn(() => this)
    toDestination = mock.fn(() => this)
    chain = mock.fn(() => this)
    start = mock.fn(() => this)
    stop = mock.fn(() => this)
    constructor() {
        mockInstances.push(this)
    }
}

class MockParam {
    value = 0
    rampTo = mock.fn()
    connect = mock.fn()
}

mock.module('tone', {
    namedExports: {
        Volume: class extends MockBase {
            volume = new MockParam()
        },
        Oscillator: class extends MockBase {
            frequency = new MockParam()
            detune = new MockParam()
            constructor(public freq?: any, public type?: string) {
                super()
            }
        },
        Gain: class extends MockBase {
            gain = new MockParam()
            constructor(public val?: number) {
                super()
            }
        },
        Noise: class extends MockBase {
            constructor(public type?: string) {
                super()
            }
        },
        Filter: class extends MockBase {
            frequency = new MockParam()
            Q = new MockParam()
            constructor(public freq?: number, public type?: string, public rolloff?: number) {
                super()
            }
        },
        Distortion: class extends MockBase {
            distortion = 0
            wet = new MockParam()
            constructor(public val?: number) {
                super()
            }
        },
        Chorus: class extends MockBase {
            wet = new MockParam()
            constructor(public freq?: number, public delay?: number, public depth?: number) {
                super()
            }
        },
        FeedbackDelay: class extends MockBase {
            wet = new MockParam()
            constructor(public delayTime?: string, public feedback?: number) {
                super()
            }
        },
        Reverb: class extends MockBase {
            wet = new MockParam()
            ready = Promise.resolve()
            constructor(public decay?: number) {
                super()
            }
        },
        AutoPanner: class extends MockBase {
            constructor(public freq?: number) {
                super()
            }
        },
        LFO: class extends MockBase {
            frequency = new MockParam()
            max = 0
            constructor(public freq?: number, public min?: number, public maxVal?: number) {
                super()
            }
        },
        Loop: class extends MockBase {
            interval = '4n'
            constructor(public callback: (time: number) => void, public intervalVal: string) {
                super()
            }
        },
        Transport: {
            scheduleOnce: mock.fn(),
            now: () => 0
        },
        Frequency: (val: string) => ({
            toFrequency: () => 440 // Mocked fixed frequency
        }),
        now: () => 0
    }
})

const { DroneEngine } = await import('./DroneEngine.ts')

describe('DroneEngine', () => {
    // Reset mockInstances before each test
    const resetMocks = () => {
        mockInstances = []
    }

    test('init() creates and connects nodes', () => {
        resetMocks()
        const drone = new DroneEngine()
        drone.init()

        // 1. Core Synthesis Layer
        const oscillators = mockInstances.filter(i => i.constructor.name === 'Oscillator')
        assert.strictEqual(oscillators.length, 4, 'Should create 4 oscillators (osc1, osc2, subOsc, fmModulator)')
        assert.strictEqual(oscillators[0].freq, 32.7) // baseFreq
        assert.strictEqual(oscillators[1].freq, 32.7 * 1.414) // osc2 tritone
        assert.strictEqual(oscillators[2].freq, 32.7 * 0.5) // subOsc
        assert.strictEqual(oscillators[3].freq, 32.7 * 2.718) // fmModulator

        // 2. FM Layer
        const gains = mockInstances.filter(i => i.constructor.name === 'Gain')
        assert.strictEqual(gains.length, 2, 'Should create 2 gains (fmGain, noiseGain)')
        assert.strictEqual(gains[0].val, 0) // fmGain

        // 3. Noise Texture
        const noise = mockInstances.find(i => i.constructor.name === 'Noise')
        assert.ok(noise, 'Should create noise')
        assert.strictEqual(noise.type, 'pink')

        // 4. Global Scaping
        const filters = mockInstances.filter(i => i.constructor.name === 'Filter')
        assert.strictEqual(filters.length, 2, 'Should create 2 filters (noiseFilter, filter)')
        assert.strictEqual(filters[1].freq, 200) // main filter freq

        const distortion = mockInstances.find(i => i.constructor.name === 'Distortion')
        assert.ok(distortion, 'Should create distortion')
        assert.strictEqual(distortion.val, 0.8)

        // Routing checks
        // Verify osc1 connects to main filter (filters[1])
        assert.ok(oscillators[0].connect.mock.calls.some((call: any) => call.arguments[0] === filters[1]), 'osc1 should connect to main filter')

        // Verify filter chain
        assert.ok(filters[1].chain.mock.calls.length > 0, 'Main filter should have a chain of effects')

        // 5. Advanced Modulation
        const lfos = mockInstances.filter(i => i.constructor.name === 'LFO')
        assert.strictEqual(lfos.length, 2, 'Should create 2 LFOs (lfoCutoff, lfoDetune)')
        assert.strictEqual(lfos[0].freq, 0.012)
        assert.strictEqual(lfos[1].freq, 0.05)

        // 6. Loop
        const loops = mockInstances.filter(i => i.constructor.name === 'Loop')
        assert.strictEqual(loops.length, 1, 'Should create 1 loop')
        assert.strictEqual(loops[0].intervalVal, '2n')
    })

    test('updateParams() updates node values', () => {
        resetMocks()
        const drone = new DroneEngine()
        drone.init()

        const distortion = mockInstances.find(i => i.constructor.name === 'Distortion')
        const reverb = mockInstances.find(i => i.constructor.name === 'Reverb')
        const fmGain = mockInstances.find(i => i.constructor.name === 'Gain' && i.val === 0)
        const filter = mockInstances.find(i => i.constructor.name === 'Filter' && i.rolloff === -24)
        const lfoDetune = mockInstances.filter(i => i.constructor.name === 'LFO')[1]

        drone.updateParams({
            intensity: 0.8,
            fmDepth: 0.5,
            chaos: 0.2,
            grit: 0.3,
            nervousness: 0.1
        })

        assert.strictEqual(distortion.wet.value, 0.4 + (0.8 * 0.6))
        assert.strictEqual(reverb.wet.value, 0.3 + (0.8 * 0.7))
        assert.ok(fmGain.gain.rampTo.mock.calls.length > 0)
        assert.strictEqual(filter.Q.value, 1 + (0.3 * 15))
        assert.ok(lfoDetune.frequency.rampTo.mock.calls.length > 0)
    })

    test('setBaseNote() updates oscillator frequencies', () => {
        resetMocks()
        const drone = new DroneEngine()
        drone.init()

        const oscillators = mockInstances.filter(i => i.constructor.name === 'Oscillator')

        drone.setBaseNote('A4')

        // baseFreq for oscillators (mocked to 440 in our Frequency mock)
        assert.ok(oscillators[0].frequency.rampTo.mock.calls.some((call: any) => call.arguments[0] === 440))
        assert.ok(oscillators[1].frequency.rampTo.mock.calls.some((call: any) => call.arguments[0] === 440 * 1.414))
        assert.ok(oscillators[2].frequency.rampTo.mock.calls.some((call: any) => call.arguments[0] === 440 * 0.5))
        assert.ok(oscillators[3].frequency.rampTo.mock.calls.some((call: any) => call.arguments[0] === 440 * 2.718))
    })

    test('setEnabled() ramps output volume', () => {
        resetMocks()
        const drone = new DroneEngine()
        drone.init()

        const output = mockInstances.find(i => i.constructor.name === 'Volume')

        drone.setEnabled(true)
        assert.ok(output.volume.rampTo.mock.calls.some((call: any) => call.arguments[0] === 0))

        drone.setEnabled(false)
        assert.ok(output.volume.rampTo.mock.calls.some((call: any) => call.arguments[0] === -Infinity))
    })

    test('dispose() cleans up nodes', () => {
        resetMocks()
        const drone = new DroneEngine()
        drone.init()
        const initialCount = mockInstances.length
        drone.dispose()

        const disposeCalls = mockInstances.filter(inst => inst.dispose.mock.calls.length > 0).length

        assert.strictEqual(disposeCalls, initialCount, 'All created nodes should be disposed')
    })
})
