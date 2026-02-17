import test from 'node:test';
import assert from 'node:assert';
import { GridWalker } from './GridWalker.ts';

test('GridWalker - zigzag pattern path', () => {
    const expectedZigZag = [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11, 15, 14, 13, 12];
    const actualZigZag = GridWalker.getPatternPath('zigzag');
    assert.deepStrictEqual(actualZigZag, expectedZigZag);
});

test('GridWalker.getNextIndex - zigzag transitions', () => {
    // (3,0) -> (3,1)
    assert.strictEqual(GridWalker.getNextIndex(3, 'zigzag'), 7);
    // (0,1) -> (0,2)
    assert.strictEqual(GridWalker.getNextIndex(4, 'zigzag'), 8);
    // (3,2) -> (3,3)
    assert.strictEqual(GridWalker.getNextIndex(11, 'zigzag'), 15);
    // (0,3) -> (0,0)
    assert.strictEqual(GridWalker.getNextIndex(12, 'zigzag'), 0);
});

test('GridWalker instance - zigzag movement', () => {
    const walker = new GridWalker('zigzag');
    assert.strictEqual(walker.getIndex(), 0);

    // Move to (1,0)
    assert.strictEqual(walker.next(), 1);
    assert.strictEqual(walker.getIndex(), 1);

    // Move to (2,0)
    assert.strictEqual(walker.next(), 2);

    // Move to (3,0)
    assert.strictEqual(walker.next(), 3);

    // Transition to (3,1) which is index 7
    assert.strictEqual(walker.next(), 7);
    assert.strictEqual(walker.getIndex(), 7);

    // Move to (2,1) which is index 6
    assert.strictEqual(walker.next(), 6);
});

test('GridWalker - linear pattern path', () => {
    const expectedLinear = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const actualLinear = GridWalker.getPatternPath('linear');
    assert.deepStrictEqual(actualLinear, expectedLinear);
});

test('GridWalker - spiral pattern path', () => {
    const expectedSpiral = [
        0, 1, 2, 3,
        7, 11, 15, 14,
        13, 12, 8, 4,
        5, 6, 10, 9
    ];
    const actualSpiral = GridWalker.getPatternPath('spiral');
    assert.deepStrictEqual(actualSpiral, expectedSpiral);
});

test('GridWalker instance - wrap around', () => {
    const walker = new GridWalker('linear');
    // Start at 0, move 15 times to reach 15
    for (let i = 0; i < 15; i++) {
        walker.next();
    }
    assert.strictEqual(walker.getIndex(), 15);
    // Next move should wrap to 0
    assert.strictEqual(walker.next(), 0);
});
