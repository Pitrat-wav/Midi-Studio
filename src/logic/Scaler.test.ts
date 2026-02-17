import test from 'node:test';
import assert from 'node:assert';
import { Scaler } from './Scaler.ts';

test('Scaler.generateChord - C Major Triad', () => {
    // 60 is C4
    const chord = Scaler.generateChord(60, 'C', 'major', 'triad');
    assert.deepStrictEqual(chord, [60, 64, 67]); // C4, E4, G4
});

test('Scaler.generateChord - D Minor Triad in C Major', () => {
    // 62 is D4
    const chord = Scaler.generateChord(62, 'C', 'major', 'triad');
    assert.deepStrictEqual(chord, [62, 65, 69]); // D4, F4, A4
});

test('Scaler.generateChord - B Diminished Triad in C Major', () => {
    // 71 is B4
    const chord = Scaler.generateChord(71, 'C', 'major', 'triad');
    assert.deepStrictEqual(chord, [71, 74, 77]); // B4, D5, F5
});

test('Scaler.generateChord - 7th chords', () => {
    const chord = Scaler.generateChord(60, 'C', 'major', '7th');
    assert.deepStrictEqual(chord, [60, 64, 67, 71]); // C4, E4, G4, B4
});

test('Scaler.generateChord - Power chords', () => {
    const chord = Scaler.generateChord(60, 'C', 'major', 'power');
    assert.deepStrictEqual(chord, [60, 67, 72]); // C4, G4, C5
});

test('Scaler.generateChord - sus2', () => {
    const chord = Scaler.generateChord(60, 'C', 'major', 'sus2');
    assert.deepStrictEqual(chord, [60, 62, 67]); // C4, D4, G4
});

test('Scaler.generateChord - sus4', () => {
    const chord = Scaler.generateChord(60, 'C', 'major', 'sus4');
    assert.deepStrictEqual(chord, [60, 65, 67]); // C4, F4, G4
});

test('Scaler.generateChord - Snap to scale', () => {
    // 61 is C#4, not in C Major. Should snap to C4 (60).
    const chord = Scaler.generateChord(61, 'C', 'major', 'triad');
    assert.deepStrictEqual(chord, [60, 64, 67]);
});

test('Scaler.generateChord - Invalid scale', () => {
    const chord = Scaler.generateChord(60, 'C', 'invalid-scale-type', 'triad');
    assert.deepStrictEqual(chord, [60]);
});

test('Scaler.getScaleDegree - basic', () => {
    assert.strictEqual(Scaler.getScaleDegree(60, 'C', 'major'), 1);
    assert.strictEqual(Scaler.getScaleDegree(62, 'C', 'major'), 2);
    assert.strictEqual(Scaler.getScaleDegree(61, 'C', 'major'), null);
});

test('Scaler.snapToScale - basic', () => {
    assert.strictEqual(Scaler.snapToScale(61, 'C', 'major'), 60);
    assert.strictEqual(Scaler.snapToScale(63, 'C', 'major'), 62); // Eb snaps to D or E?
    // noteMidi = 3. scaleMidis = [0, 2, 4, 5, 7, 9, 11]
    // sm=2: diff=1. sm=4: diff=1.
    // It picks the first one encountered: 2.
    // So 63 snaps to 62.
});
