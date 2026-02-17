import { test, describe, mock } from 'node:test'
import assert from 'node:assert'
import { TuringMachine } from './TuringMachine'

describe('TuringMachine', () => {
    test('initializes with given non-zero value', () => {
        const tm = new TuringMachine(0x1234);
        assert.strictEqual(tm.getRegister(), 0x1234);
    });

    test('initializes with 0 if given 0', () => {
        const tm = new TuringMachine(0);
        assert.strictEqual(tm.getRegister(), 0);
    });

    test('initializes with undefined results in valid range', () => {
        for (let i = 0; i < 100; i++) {
            const tm = new TuringMachine();
            const reg = tm.getRegister();
            assert.ok(reg >= 0 && reg <= 65535, `Value ${reg} out of range`);
        }
    });

    describe('step', () => {
        test('isLocked=true maintains loop pattern', () => {
            const tm = new TuringMachine(0xAAAA); // 1010 1010 1010 1010

            // Step 1: lastBit=1, nextBit=1 -> (0xAAAA << 1 | 1) & 0xFFFF = 0x5555
            assert.strictEqual(tm.step(0.5, true), 0x5555);

            // Step 2: lastBit=0, nextBit=0 -> (0x5555 << 1 | 0) & 0xFFFF = 0xAAAA
            assert.strictEqual(tm.step(0.5, true), 0xAAAA);
        });

        test('probability=0 maintains loop pattern', () => {
            const tm = new TuringMachine(0xAAAA);
            assert.strictEqual(tm.step(0, false), 0x5555);
            assert.strictEqual(tm.step(0, false), 0xAAAA);
        });

        test('probability=1.0 randomizes incoming bit to 1', () => {
            const tm = new TuringMachine(0xAAAA);
            const originalRandom = Math.random;
            let calls = 0;
            Math.random = () => {
                calls++;
                if (calls === 1) return 0.1; // < 1.0
                if (calls === 2) return 0.6; // > 0.5
                return 0.5;
            };

            assert.strictEqual(tm.step(1.0, false), 0x5555);
            assert.strictEqual(calls, 2);
            Math.random = originalRandom;
        });

        test('probability=1.0 randomizes incoming bit to 0', () => {
            const tm = new TuringMachine(0xAAAA);
            const originalRandom = Math.random;
            let calls = 0;
            Math.random = () => {
                calls++;
                if (calls === 1) return 0.1; // < 1.0
                if (calls === 2) return 0.4; // <= 0.5
                return 0.5;
            };

            assert.strictEqual(tm.step(1.0, false), 0x5554);
            assert.strictEqual(calls, 2);
            Math.random = originalRandom;
        });

        test('probability=0.5 flips bit when random < 0.5', () => {
            const tm = new TuringMachine(0xAAAA);
            const originalRandom = Math.random;
            let calls = 0;
            Math.random = () => {
                calls++;
                if (calls === 1) return 0.1; // < 0.5
                return 0.5;
            };

            assert.strictEqual(tm.step(0.5, false), 0x5554);
            assert.strictEqual(calls, 1);
            Math.random = originalRandom;
        });

        test('probability=0.5 keeps bit when random >= 0.5', () => {
            const tm = new TuringMachine(0xAAAA);
            const originalRandom = Math.random;
            let calls = 0;
            Math.random = () => {
                calls++;
                if (calls === 1) return 0.6; // >= 0.5
                return 0.5;
            };

            assert.strictEqual(tm.step(0.5, false), 0x5555);
            assert.strictEqual(calls, 1);
            Math.random = originalRandom;
        });
    });

    describe('auxiliary methods', () => {
        test('getValue returns normalized value', () => {
            const tm = new TuringMachine(0x00FF);
            assert.strictEqual(tm.getValue(8), 1.0);

            tm.setRegister(0x0000);
            assert.strictEqual(tm.getValue(8), 0.0);

            tm.setRegister(0x007F); // 127
            assert.strictEqual(tm.getValue(8), 127/255);
        });

        test('getRegister and setRegister', () => {
            const tm = new TuringMachine();
            tm.setRegister(0x1234);
            assert.strictEqual(tm.getRegister(), 0x1234);

            tm.setRegister(0x1FFFF); // Should be masked to 16 bits
            assert.strictEqual(tm.getRegister(), 0xFFFF);
        });
    });
});
