import { test, describe } from 'node:test';
import assert from 'node:assert';
import { bjorklund, rotateArray } from './bjorklund.ts';

describe('bjorklund', () => {
    test('should handle edge cases', () => {
        assert.deepStrictEqual(bjorklund(4, 0), [0, 0, 0, 0]);
        assert.deepStrictEqual(bjorklund(4, 4), [1, 1, 1, 1]);
        assert.deepStrictEqual(bjorklund(4, 5), [1, 1, 1, 1]);
        assert.deepStrictEqual(bjorklund(0, 0), []);
    });

    test('should generate correct Euclidean rhythms', () => {
        // E(3, 8) = [1, 0, 0, 1, 0, 0, 1, 0]
        assert.deepStrictEqual(bjorklund(8, 3), [1, 0, 0, 1, 0, 0, 1, 0]);

        // E(5, 8) = [1, 1, 0, 1, 1, 0, 1, 0]
        assert.deepStrictEqual(bjorklund(8, 5), [1, 1, 0, 1, 1, 0, 1, 0]);

        // E(2, 4) = [1, 0, 1, 0]
        assert.deepStrictEqual(bjorklund(4, 2), [1, 0, 1, 0]);

        // E(1, 4) = [1, 0, 0, 0]
        assert.deepStrictEqual(bjorklund(4, 1), [1, 0, 0, 0]);

        // E(3, 4) = [1, 1, 1, 0]
        assert.deepStrictEqual(bjorklund(4, 3), [1, 1, 1, 0]);
    });
});

describe('rotateArray', () => {
    test('should rotate array correctly', () => {
        assert.deepStrictEqual(rotateArray([1, 0, 0, 1], 1), [1, 1, 0, 0]);
        assert.deepStrictEqual(rotateArray([1, 0, 0, 1], -1), [0, 0, 1, 1]);
        assert.deepStrictEqual(rotateArray([1, 0, 0, 1], 0), [1, 0, 0, 1]);
        assert.deepStrictEqual(rotateArray([1, 0, 0, 1], 4), [1, 0, 0, 1]);
        assert.deepStrictEqual(rotateArray([1, 0, 0, 1], 5), [1, 1, 0, 0]);
    });

    test('should handle empty arrays', () => {
        assert.deepStrictEqual(rotateArray([], 1), []);
    });
});
