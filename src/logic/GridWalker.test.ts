import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GridWalker } from './GridWalker.ts';

describe('GridWalker Linear Movement', () => {
    describe('getNextIndex', () => {
        test('should increment index correctly in the middle of a row', () => {
            assert.strictEqual(GridWalker.getNextIndex(0, 'linear'), 1);
            assert.strictEqual(GridWalker.getNextIndex(1, 'linear'), 2);
            assert.strictEqual(GridWalker.getNextIndex(2, 'linear'), 3);
        });

        test('should wrap to the next row at row boundaries', () => {
            assert.strictEqual(GridWalker.getNextIndex(3, 'linear'), 4);
            assert.strictEqual(GridWalker.getNextIndex(7, 'linear'), 8);
            assert.strictEqual(GridWalker.getNextIndex(11, 'linear'), 12);
        });

        test('should wrap around to the beginning of the grid at the end', () => {
            assert.strictEqual(GridWalker.getNextIndex(15, 'linear'), 0);
        });

        test('should generate a full 16-step linear sequence', () => {
            let current = 0;
            const sequence = [current];
            for (let i = 0; i < 15; i++) {
                current = GridWalker.getNextIndex(current, 'linear');
                sequence.push(current);
            }
            const expected = Array.from({ length: 16 }, (_, i) => i);
            assert.deepStrictEqual(sequence, expected);

            // One more step should wrap to 0
            assert.strictEqual(GridWalker.getNextIndex(current, 'linear'), 0);
        });
    });

    describe('Instance next() method', () => {
        test('should move linearly through the grid', () => {
            const walker = new GridWalker('linear');
            assert.strictEqual(walker.getIndex(), 0);

            assert.strictEqual(walker.next(), 1);
            assert.strictEqual(walker.getIndex(), 1);

            assert.strictEqual(walker.next(), 2);
            assert.strictEqual(walker.next(), 3);
            assert.strictEqual(walker.next(), 4);

            // Fast forward to end
            for (let i = 0; i < 11; i++) {
                walker.next();
            }
            assert.strictEqual(walker.getIndex(), 15);

            // Wrap around
            assert.strictEqual(walker.next(), 0);
            assert.strictEqual(walker.getIndex(), 0);
        });
    });
});
