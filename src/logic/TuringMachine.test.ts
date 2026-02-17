import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TuringMachine } from './TuringMachine.ts';

describe('TuringMachine', () => {
    it('should initialize with a specific value', () => {
        const tm = new TuringMachine(0x1234);
        assert.strictEqual(tm.getRegister(), 0x1234);
    });

    it('should handle initial value of 0', () => {
        const tm = new TuringMachine(0);
        assert.strictEqual(tm.getRegister(), 0);
    });

    it('should initialize with a random value if none provided', () => {
        const tm = new TuringMachine();
        const reg = tm.getRegister();
        assert.ok(reg >= 0 && reg <= 0xFFFF);
    });

    describe('step', () => {
        it('should shift left and insert last bit when locked', () => {
            const tm = new TuringMachine(0x8000); // 1000 0000 0000 0000
            // last bit is 1.
            // step should result in 0000 0000 0000 0001
            const result = tm.step(0, true);
            assert.strictEqual(result, 0x0001);
            assert.strictEqual(tm.getRegister(), 0x0001);
        });

        it('should shift left and insert 0 when last bit is 0 and locked', () => {
            const tm = new TuringMachine(0x4000); // 0100 0000 0000 0000
            // last bit is 0.
            // step should result in 1000 0000 0000 0000 (0x8000)
            const result = tm.step(0, true);
            assert.strictEqual(result, 0x8000);
        });

        it('should behave as locked when probability is 0', () => {
            const tm = new TuringMachine(0x8000);
            const result = tm.step(0, false);
            assert.strictEqual(result, 0x0001);
        });

        it('should flip the bit when probability is 0.5 (evolving) and random hits', () => {
            const tm = new TuringMachine(0x8000); // last bit is 1
            const originalRandom = Math.random;
            // Mock random to be < 0.5 for the evolution check
            Math.random = () => 0.1;
            try {
                // probability = 0.5. 0.1 < 0.5, so it should flip.
                // last bit was 1, so next bit should be 0.
                const result = tm.step(0.5, false);
                assert.strictEqual(result, 0x0000);
            } finally {
                Math.random = originalRandom;
            }
        });

        it('should not flip the bit when probability is 0.5 and random does not hit', () => {
            const tm = new TuringMachine(0x8000); // last bit is 1
            const originalRandom = Math.random;
            // Mock random to be >= 0.5 for the evolution check
            Math.random = () => 0.6;
            try {
                // 0.6 >= 0.5, so it should NOT flip.
                const result = tm.step(0.5, false);
                assert.strictEqual(result, 0x0001);
            } finally {
                Math.random = originalRandom;
            }
        });

        it('should randomize the bit when probability is 1.0', () => {
            const tm = new TuringMachine(0x8000); // last bit is 1
            const originalRandom = Math.random;

            // Case 1: Random bit becomes 1
            let randomCounter = 0;
            Math.random = () => {
                randomCounter++;
                if (randomCounter === 1) return 0.1; // < probability (1.0)
                return 0.9; // > 0.5 for nextBit
            };

            try {
                const result = tm.step(1.0, false);
                assert.strictEqual(result, 0x0001);
            } finally {
                Math.random = originalRandom;
            }

            // Case 2: Random bit becomes 0
            randomCounter = 0;
            Math.random = () => {
                randomCounter++;
                if (randomCounter === 1) return 0.1; // < probability (1.0)
                return 0.1; // < 0.5 for nextBit
            };

            try {
                tm.setRegister(0x8000);
                const result = tm.step(1.0, false);
                assert.strictEqual(result, 0x0000);
            } finally {
                Math.random = originalRandom;
            }
        });
    });

    describe('getValue', () => {
        it('should return normalized value for 8 bits', () => {
            const tm = new TuringMachine(0x00FF);
            // register is 255. mask for 8 bits is 255. 255/255 = 1.0
            assert.strictEqual(tm.getValue(8), 1.0);

            tm.setRegister(0x0000);
            assert.strictEqual(tm.getValue(8), 0.0);

            tm.setRegister(0x007F); // 127
            assert.strictEqual(tm.getValue(8), 127/255);
        });

        it('should return normalized value for default (8 bits)', () => {
            const tm = new TuringMachine(0x00FF);
            assert.strictEqual(tm.getValue(), 1.0);
        });
    });

    describe('getRegister and setRegister', () => {
        it('should get and set the register value', () => {
            const tm = new TuringMachine(0);
            tm.setRegister(0xABCD);
            assert.strictEqual(tm.getRegister(), 0xABCD);
        });

        it('should mask setRegister to 16 bits', () => {
            const tm = new TuringMachine(0);
            tm.setRegister(0x1FFFF);
            assert.strictEqual(tm.getRegister(), 0xFFFF);
        });
    });
});
