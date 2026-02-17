import { test, describe, mock } from 'node:test'
import assert from 'node:assert'
import { TuringMachine } from './TuringMachine'

describe('TuringMachine', () => {
    test('initializes with given value', () => {
        const tm = new TuringMachine(0x1234);
        assert.strictEqual(tm.getRegister(), 0x1234);
    });

    test('initializes with 0 if given 0', () => {
        const tm = new TuringMachine(0);
        assert.strictEqual(tm.getRegister(), 0);
    });

    test('initializes with random value if no value given', () => {
        const tm = new TuringMachine();
        const reg = tm.getRegister();
        assert.ok(reg >= 0 && reg <= 0xFFFF);
    });

    test('step with isLocked=true keeps same loop', () => {
        const initialValue = 0xAAAA; // 1010 1010 1010 1010
        const tm = new TuringMachine(initialValue);

        const nextValue = tm.step(0.5, true);
        assert.strictEqual(nextValue, 0x5555);

        const nextValue2 = tm.step(0.5, true);
        assert.strictEqual(nextValue2, 0xAAAA);
    });

    test('step with probability=0 acts like locked', () => {
        const initialValue = 0xAAAA;
        const tm = new TuringMachine(initialValue);
        const nextValue = tm.step(0, false);
        assert.strictEqual(nextValue, 0x5555);
    });

    test('step with probability=1 randomizes bit', () => {
        const tm = new TuringMachine(0xAAAA);
        const originalRandom = Math.random;
        let callCount = 0;
        Math.random = () => {
            callCount++;
            if (callCount === 1) return 0.1; // probability check
            if (callCount === 2) return 0.9; // next bit check (> 0.5 -> 1)
            return 0;
        };

        try {
            let nextValue = tm.step(1.0, false);
            assert.strictEqual(nextValue, 0x5555, `First step failed, nextValue was ${nextValue}, callCount was ${callCount}`);

            callCount = 0;
            Math.random = () => {
                callCount++;
                if (callCount === 1) return 0.1; // probability check
                if (callCount === 2) return 0.1; // next bit check (< 0.5 -> 0)
                return 0;
            };
            nextValue = tm.step(1.0, false);
            assert.strictEqual(nextValue, 0xAAAA, `Second step failed, nextValue was ${nextValue}, callCount was ${callCount}`);
        } finally {
            Math.random = originalRandom;
        }
    });

    test('step with probability=0.5 flips bit when random matches', () => {
        const tm = new TuringMachine(0xAAAA);
        const originalRandom = Math.random;
        Math.random = () => 0.1; // < 0.5

        try {
            const nextValue = tm.step(0.5, false);
            assert.strictEqual(nextValue, 0x5554);
        } finally {
            Math.random = originalRandom;
        }
    });

    test('step with probability=0.5 keeps bit when random does not match', () => {
        const tm = new TuringMachine(0xAAAA);
        const originalRandom = Math.random;
        Math.random = () => 0.6; // > 0.5

        try {
            const nextValue = tm.step(0.5, false);
            assert.strictEqual(nextValue, 0x5555);
        } finally {
            Math.random = originalRandom;
        }
    });

    test('getValue returns normalized value', () => {
        const tm = new TuringMachine(0x00FF);
        assert.strictEqual(tm.getValue(8), 1.0);

        tm.setRegister(0x0000);
        assert.strictEqual(tm.getValue(8), 0.0);

        tm.setRegister(0x007F);
        assert.strictEqual(tm.getValue(8), 127/255);
    });

    test('setRegister masks to 16 bits', () => {
        const tm = new TuringMachine();
        tm.setRegister(0xFFFFFF);
        assert.strictEqual(tm.getRegister(), 0xFFFF);
    });
});
