import { test, describe } from 'node:test';
import assert from 'node:assert';
import { hasCycle } from './graphUtils.ts';

describe('hasCycle', () => {
    test('should return false for an empty graph', () => {
        assert.strictEqual(hasCycle([], []), false);
    });

    test('should return false for a graph with no edges', () => {
        assert.strictEqual(hasCycle(['1', '2', '3'], []), false);
    });

    test('should return false for a simple acyclic graph', () => {
        const nodes = ['1', '2', '3'];
        const edges = [
            { source: '1', target: '2' },
            { source: '2', target: '3' }
        ] as any;
        assert.strictEqual(hasCycle(nodes, edges), false);
    });

    test('should return true for a simple cycle', () => {
        const nodes = ['1', '2'];
        const edges = [
            { source: '1', target: '2' },
            { source: '2', target: '1' }
        ] as any;
        assert.strictEqual(hasCycle(nodes, edges), true);
    });

    test('should return true for a self-loop', () => {
        const nodes = ['1'];
        const edges = [
            { source: '1', target: '1' }
        ] as any;
        assert.strictEqual(hasCycle(nodes, edges), true);
    });

    test('should return true for a cycle in a larger graph', () => {
        const nodes = ['1', '2', '3', '4'];
        const edges = [
            { source: '1', target: '2' },
            { source: '2', target: '3' },
            { source: '3', target: '4' },
            { source: '4', target: '2' }
        ] as any;
        assert.strictEqual(hasCycle(nodes, edges), true);
    });

    test('should return false for a complex acyclic graph', () => {
        const nodes = ['1', '2', '3', '4', '5'];
        const edges = [
            { source: '1', target: '2' },
            { source: '1', target: '3' },
            { source: '2', target: '4' },
            { source: '3', target: '4' },
            { source: '4', target: '5' }
        ] as any;
        assert.strictEqual(hasCycle(nodes, edges), false);
    });

    test('should handle disconnected components correctly', () => {
        const nodes = ['1', '2', '3', '4'];
        const edges = [
            { source: '1', target: '2' },
            { source: '3', target: '4' },
            { source: '4', target: '3' }
        ] as any;
        assert.strictEqual(hasCycle(nodes, edges), true);
    });
});
