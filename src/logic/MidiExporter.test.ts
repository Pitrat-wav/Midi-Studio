import { test, mock } from 'node:test';
import assert from 'node:assert';

// 1. Setup mocks before importing the target module
mock.module('tone', {
    namedExports: {
        Frequency: (val: any) => ({
            toNote: () => 'C4'
        })
    }
});

const mockTrack = {
    addTrackName: mock.fn(),
    setTempo: mock.fn(),
    addEvent: mock.fn(),
};

const mockWriter = {
    buildFile: mock.fn(() => new Uint8Array([77, 84, 104, 100, 0, 0, 0, 6])),
};

const MidiWriterMock = {
    Track: mock.fn(function (this: any) { return mockTrack; }),
    NoteEvent: mock.fn(function (this: any, opts: any) { return opts; }),
    Writer: mock.fn(function (this: any) { return mockWriter; }),
};

mock.module('midi-writer-js', {
    defaultExport: MidiWriterMock,
    namedExports: MidiWriterMock
});

// Import types for test data
import type { BassStep } from './StingGenerator.ts';
import type { Stage, SnakeCell } from '../store/instrumentStore.ts';

// 2. Import the function to test
const { exportToMidi } = await import('./MidiExporter.ts');

const defaultDrums = {
    kick: Array(16).fill(0),
    snare: Array(16).fill(0),
    hihat: Array(16).fill(0),
    hihatOpen: Array(16).fill(0),
    clap: Array(16).fill(0)
};

const defaultPads = { notes: [], active: false };

test('exportToMidi - drums target', (t) => {
    mockTrack.addEvent.mock.resetCalls();
    mockTrack.addTrackName.mock.resetCalls();
    const drums = { ...defaultDrums, kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] };

    const result = exportToMidi(120, drums, [], [], [], '', defaultPads, undefined, 'drums');

    assert.ok(result instanceof Uint8Array);
    assert.strictEqual(mockTrack.addTrackName.mock.calls[0].arguments[0], 'Drums');
    // 4 bars * 16 steps = 64 events
    assert.strictEqual(mockTrack.addEvent.mock.calls.length, 64);
});

test('exportToMidi - bass target', (t) => {
    mockTrack.addEvent.mock.resetCalls();
    mockTrack.addTrackName.mock.resetCalls();
    const bassPattern: BassStep[] = [
        { note: 'C2', velocity: 1.0, slide: false, accent: true, active: true },
        { note: 'C2', velocity: 0.7, slide: true, accent: false, active: true },
        { note: 'C2', velocity: 0.7, slide: false, accent: false, active: false },
    ];

    const result = exportToMidi(125, defaultDrums, bassPattern, [], [], '', defaultPads, undefined, 'bass');

    assert.ok(result instanceof Uint8Array);
    assert.strictEqual(mockTrack.addTrackName.mock.calls[0].arguments[0], 'Acid Bass');
    // 4 bars * 3 steps = 12 events
    assert.strictEqual(mockTrack.addEvent.mock.calls.length, 12);
});

test('exportToMidi - seq185 target', (t) => {
    mockTrack.addEvent.mock.resetCalls();
    const stages: Stage[] = [
        { pitch: 60, velocity: 0.8, length: 1, pulseCount: 2, gateMode: 1, probability: 1, condition: 'none' }, // Single mode
        { pitch: 62, velocity: 0.8, length: 1, pulseCount: 1, gateMode: 2, probability: 1, condition: 'none' }, // Multi mode
        { pitch: 64, velocity: 0.8, length: 1, pulseCount: 1, gateMode: 0, probability: 1, condition: 'none' }, // Mute mode
    ];

    // totalPulses is 64.
    // Stage 1: 1*2 = 2 pulses
    // Stage 2: 1*1 = 1 pulse
    // Stage 3: 1*1 = 1 pulse
    // Total cycle = 4 pulses.
    // 64 pulses / 4 = 16 cycles.
    // Each cycle has 1 (Single) + 1 (Multi) + 1 (Mute) = 3 events.
    // Wait, Multi mode with duration 1 gives 1 event.
    // So 16 * 3 = 48 events expected.

    const result = exportToMidi(120, defaultDrums, [], stages, [], '', defaultPads, undefined, 'seq185');

    assert.ok(result instanceof Uint8Array);
    assert.strictEqual(mockTrack.addEvent.mock.calls.length, 48);
});

test('exportToMidi - snake target', (t) => {
    mockTrack.addEvent.mock.resetCalls();
    const snakeGrid = [
        { note: 60, active: true },
        { note: 62, active: false },
    ];

    const result = exportToMidi(120, defaultDrums, [], [], snakeGrid, 'linear', defaultPads, undefined, 'snake');

    assert.ok(result instanceof Uint8Array);
    // 4 bars * 2 cells = 8 events
    assert.strictEqual(mockTrack.addEvent.mock.calls.length, 8);
});

test('exportToMidi - pads target', (t) => {
    mockTrack.addEvent.mock.resetCalls();
    const pads = { notes: ['C3', 'E3', 'G3'], active: true };

    const result = exportToMidi(120, defaultDrums, [], [], [], '', pads, undefined, 'pads');

    assert.ok(result instanceof Uint8Array);
    // 4 bars * 1 event per bar = 4 events
    assert.strictEqual(mockTrack.addEvent.mock.calls.length, 4);
});

test('exportToMidi - harm target', (t) => {
    mockTrack.addEvent.mock.resetCalls();
    const harmGrid = [
        { note: 60, active: true, velocity: 0.9 },
        { note: 62, active: true, velocity: 0.7 },
    ];

    const result = exportToMidi(120, defaultDrums, [], [], [], '', defaultPads, harmGrid, 'harm');

    assert.ok(result instanceof Uint8Array);
    // 4 bars * 2 steps = 8 events
    assert.strictEqual(mockTrack.addEvent.mock.calls.length, 8);
});

test('exportToMidi - turing target', (t) => {
    mockTrack.addEvent.mock.resetCalls();

    const result = exportToMidi(120, defaultDrums, [], [], [], '', defaultPads, undefined, 'turing', undefined, 0xABCD, 8);

    assert.ok(result instanceof Uint8Array);
    // Loop runs 64 times
    assert.strictEqual(mockTrack.addEvent.mock.calls.length, 64);
});
