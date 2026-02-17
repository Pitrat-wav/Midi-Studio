import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GridWalker } from './GridWalker.ts';

describe('GridWalker', () => {
    describe('getNextIndex', () => {
        test('linear pattern - simple steps', () => {
            assert.strictEqual(GridWalker.getNextIndex(0, 'linear'), 1);
            assert.strictEqual(GridWalker.getNextIndex(1, 'linear'), 2);
            assert.strictEqual(GridWalker.getNextIndex(2, 'linear'), 3);
        });

        test('linear pattern - row wrap', () => {
            assert.strictEqual(GridWalker.getNextIndex(3, 'linear'), 4);
            assert.strictEqual(GridWalker.getNextIndex(7, 'linear'), 8);
        });

        test('linear pattern - grid wrap', () => {
            assert.strictEqual(GridWalker.getNextIndex(15, 'linear'), 0);
        });

        test('linear pattern - full cycle', () => {
            let current = 0;
            const path = [0];
            for (let i = 0; i < 15; i++) {
                current = GridWalker.getNextIndex(current, 'linear');
                path.push(current);
            }
            assert.deepStrictEqual(path, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
            assert.strictEqual(GridWalker.getNextIndex(current, 'linear'), 0);
        });

        test('zigzag pattern - basic movement', () => {
            // Row 0 (even): 0->1->2->3
            assert.strictEqual(GridWalker.getNextIndex(0, 'zigzag'), 1);
            assert.strictEqual(GridWalker.getNextIndex(1, 'zigzag'), 2);
            assert.strictEqual(GridWalker.getNextIndex(2, 'zigzag'), 3);

            // Wrap to Row 1 (odd): 3->7 (x stays 3, y becomes 1. 1*4+3=7)
            assert.strictEqual(GridWalker.getNextIndex(3, 'zigzag'), 7);

            // Row 1 (odd): 7->6->5->4
            assert.strictEqual(GridWalker.getNextIndex(7, 'zigzag'), 6);
            assert.strictEqual(GridWalker.getNextIndex(6, 'zigzag'), 5);
            assert.strictEqual(GridWalker.getNextIndex(5, 'zigzag'), 4);

            // Wrap to Row 2 (even): 4->8 (x stays 0, y becomes 2. 2*4+0=8)
            assert.strictEqual(GridWalker.getNextIndex(4, 'zigzag'), 8);
        });

        test('spiral pattern - sequence', () => {
            // [0,0]->[1,0]->[2,0]->[3,0]->[3,1]->[3,2]->[3,3]->[2,3]->[1,3]->[0,3]->[0,2]->[0,1]->[1,1]->[2,1]->[2,2]->[1,2]
            // Indexes: 0, 1, 2, 3, 7, 11, 15, 14, 13, 12, 8, 4, 5, 6, 10, 9
            assert.strictEqual(GridWalker.getNextIndex(0, 'spiral'), 1);
            assert.strictEqual(GridWalker.getNextIndex(3, 'spiral'), 7);
            assert.strictEqual(GridWalker.getNextIndex(15, 'spiral'), 14);
            assert.strictEqual(GridWalker.getNextIndex(12, 'spiral'), 8);
            assert.strictEqual(GridWalker.getNextIndex(9, 'spiral'), 0);
        });
    });

    describe('instance methods', () => {
        test('initial state', () => {
            const walker = new GridWalker('linear');
            assert.strictEqual(walker.getIndex(), 0);
            assert.strictEqual(walker.x, 0);
            assert.strictEqual(walker.y, 0);
        });

        test('next() with linear pattern', () => {
            const walker = new GridWalker('linear');
            assert.strictEqual(walker.next(), 1);
            assert.strictEqual(walker.x, 1);
            assert.strictEqual(walker.y, 0);

            assert.strictEqual(walker.next(), 2);
            assert.strictEqual(walker.next(), 3);

            assert.strictEqual(walker.next(), 4);
            assert.strictEqual(walker.x, 0);
            assert.strictEqual(walker.y, 1);
        });

        test('getIndex() returns y * 4 + x', () => {
            const walker = new GridWalker('linear');
            walker.x = 2;
            walker.y = 1;
            assert.strictEqual(walker.getIndex(), 6);
        });
    });
});
