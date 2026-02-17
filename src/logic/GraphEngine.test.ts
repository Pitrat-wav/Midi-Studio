import { test, describe } from 'node:test'
import assert from 'node:assert'
import { GraphEngine } from './GraphEngine'

describe('GraphEngine.hasCycle', () => {
    test('Empty graph has no cycle', () => {
        assert.strictEqual(GraphEngine.hasCycle([], []), false)
    })

    test('Single node has no cycle', () => {
        assert.strictEqual(GraphEngine.hasCycle(['A'], []), false)
    })

    test('Simple path has no cycle', () => {
        const nodes = ['A', 'B', 'C']
        const edges = [
            { id: '1', source: 'A', target: 'B' },
            { id: '2', source: 'B', target: 'C' }
        ] as any[]
        assert.strictEqual(GraphEngine.hasCycle(nodes, edges), false)
    })

    test('Simple cycle (2 nodes) is detected', () => {
        const nodes = ['A', 'B']
        const edges = [
            { id: '1', source: 'A', target: 'B' },
            { id: '2', source: 'B', target: 'A' }
        ] as any[]
        assert.strictEqual(GraphEngine.hasCycle(nodes, edges), true)
    })

    test('Longer cycle (3 nodes) is detected', () => {
        const nodes = ['A', 'B', 'C']
        const edges = [
            { id: '1', source: 'A', target: 'B' },
            { id: '2', source: 'B', target: 'C' },
            { id: '3', source: 'C', target: 'A' }
        ] as any[]
        assert.strictEqual(GraphEngine.hasCycle(nodes, edges), true)
    })

    test('Self-loop is detected', () => {
        const nodes = ['A']
        const edges = [
            { id: '1', source: 'A', target: 'A' }
        ] as any[]
        assert.strictEqual(GraphEngine.hasCycle(nodes, edges), true)
    })

    test('Cycle in disconnected component is detected', () => {
        const nodes = ['A', 'B', 'C', 'D']
        const edges = [
            { id: '1', source: 'A', target: 'B' },
            { id: '2', source: 'C', target: 'D' },
            { id: '3', source: 'D', target: 'C' }
        ] as any[]
        assert.strictEqual(GraphEngine.hasCycle(nodes, edges), true)
    })

    test('Complex DAG has no cycle', () => {
        const nodes = ['A', 'B', 'C', 'D', 'E']
        const edges = [
            { id: '1', source: 'A', target: 'B' },
            { id: '2', source: 'A', target: 'C' },
            { id: '3', source: 'B', target: 'D' },
            { id: '4', source: 'C', target: 'D' },
            { id: '5', source: 'D', target: 'E' },
            { id: '6', source: 'B', target: 'E' }
        ] as any[]
        assert.strictEqual(GraphEngine.hasCycle(nodes, edges), false)
    })

    test('Complex graph with cycle is detected', () => {
        const nodes = ['A', 'B', 'C', 'D', 'E']
        const edges = [
            { id: '1', source: 'A', target: 'B' },
            { id: '2', source: 'B', target: 'C' },
            { id: '3', source: 'C', target: 'D' },
            { id: '4', source: 'D', target: 'B' }, // Cycle: B-C-D-B
            { id: '5', source: 'D', target: 'E' }
        ] as any[]
        assert.strictEqual(GraphEngine.hasCycle(nodes, edges), true)
    })
})
