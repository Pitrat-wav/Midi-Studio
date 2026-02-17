import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TuringMachine } from './TuringMachine.ts';

describe('TuringMachine.getValue', () => {
    it('returns 0.0 when the register is 0', () => {
        const tm = new TuringMachine();
        tm.setRegister(0);
        assert.strictEqual(tm.getValue(8), 0.0);
    });

    it('returns 1.0 when the register is 255 (8 bits) and bitCount is 8', () => {
        const tm = new TuringMachine();
        tm.setRegister(255);
        assert.strictEqual(tm.getValue(8), 1.0);
    });

    it('returns 1.0 when the register is 65535 and bitCount is 8 (only uses lower 8 bits)', () => {
        const tm = new TuringMachine();
        tm.setRegister(65535);
        assert.strictEqual(tm.getValue(8), 1.0);
    });

    it('returns approximately 0.5 when the register is 127 and bitCount is 8', () => {
        const tm = new TuringMachine();
        tm.setRegister(127);
        assert.strictEqual(tm.getValue(8), 127 / 255);
    });

    it('works with different bitCount values (e.g., 4 bits)', () => {
        const tm = new TuringMachine();
        tm.setRegister(15); // 0b1111
        assert.strictEqual(tm.getValue(4), 1.0);

        tm.setRegister(7); // 0b0111
        assert.strictEqual(tm.getValue(4), 7 / 15);

        tm.setRegister(0);
        assert.strictEqual(tm.getValue(4), 0.0);
    });

    it('works with bitCount of 1', () => {
        const tm = new TuringMachine();
        tm.setRegister(1);
        assert.strictEqual(tm.getValue(1), 1.0);

        tm.setRegister(0);
        assert.strictEqual(tm.getValue(1), 0.0);

        tm.setRegister(2); // 0b10 - bit 0 is 0
        assert.strictEqual(tm.getValue(1), 0.0);
    });

    it('works with bitCount of 16', () => {
        const tm = new TuringMachine();
        tm.setRegister(65535);
        assert.strictEqual(tm.getValue(16), 1.0);

        tm.setRegister(32767); // 0x7FFF
        assert.strictEqual(tm.getValue(16), 32767 / 65535);
    });

    it('uses the default bitCount of 8', () => {
        const tm = new TuringMachine();
        tm.setRegister(255);
        assert.strictEqual(tm.getValue(), 1.0);
    });
});
