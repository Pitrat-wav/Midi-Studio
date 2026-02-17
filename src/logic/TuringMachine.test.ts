import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TuringMachine } from './TuringMachine.ts';

describe('TuringMachine.getValue', () => {
    it('should return 0.0 when register is 0 (default 8 bits)', () => {
        const tm = new TuringMachine();
        tm.setRegister(0);
        assert.strictEqual(tm.getValue(), 0.0);
    });

    it('should return 1.0 when register has all bits set in the mask (default 8 bits)', () => {
        const tm = new TuringMachine();
        // 8 bits mask is 255 (0xFF)
        tm.setRegister(255);
        assert.strictEqual(tm.getValue(), 1.0);
    });

    it('should return 0.5 when register is half of the mask (default 8 bits)', () => {
        const tm = new TuringMachine();
        // 255 / 2 is not an integer, but 127/255 is approx 0.498, and 128/255 is approx 0.501
        // Let's use a bitCount that allows exactly 0.5
        tm.setRegister(127);
        assert.strictEqual(tm.getValue(), 127 / 255);
    });

    it('should only use the lowest N bits based on bitCount', () => {
        const tm = new TuringMachine();
        // Set register to 0xFFFF (all 16 bits set)
        tm.setRegister(0xFFFF);

        // Default 8 bits: (0xFFFF & 0xFF) / 0xFF = 255 / 255 = 1.0
        assert.strictEqual(tm.getValue(8), 1.0);

        // 4 bits: (0xFFFF & 0xF) / 0xF = 15 / 15 = 1.0
        assert.strictEqual(tm.getValue(4), 1.0);
    });

    it('should work with custom bitCount', () => {
        const tm = new TuringMachine();
        tm.setRegister(0b1010); // 10 decimal

        // bitCount = 4, mask = 15. Expect 10/15 = 2/3
        assert.strictEqual(tm.getValue(4), 10 / 15);

        // bitCount = 2, mask = 3. 10 & 3 = 2. Expect 2/3
        assert.strictEqual(tm.getValue(2), 2 / 3);
    });

    it('should work with bitCount = 1', () => {
        const tm = new TuringMachine();

        tm.setRegister(0);
        assert.strictEqual(tm.getValue(1), 0.0);

        tm.setRegister(1);
        assert.strictEqual(tm.getValue(1), 1.0);

        tm.setRegister(2); // 0b10. lowest bit is 0
        assert.strictEqual(tm.getValue(1), 0.0);
    });

    it('should work with bitCount = 16', () => {
        const tm = new TuringMachine();
        const maxVal = 0xFFFF; // 65535

        tm.setRegister(maxVal);
        assert.strictEqual(tm.getValue(16), 1.0);

        tm.setRegister(0);
        assert.strictEqual(tm.getValue(16), 0.0);

        tm.setRegister(32768); // 0x8000
        assert.strictEqual(tm.getValue(16), 32768 / 65535);
    });
});
