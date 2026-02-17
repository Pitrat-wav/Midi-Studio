import { test, describe } from 'node:test'
import assert from 'node:assert'
import { GridWalker, SnakePattern } from './GridWalker'

describe('GridWalker', () => {
    describe('Traversals', () => {
        test('linear pattern traversal', () => {
            const walker = new GridWalker('linear')
            assert.strictEqual(walker.getIndex(), 0)

            // First row
            assert.strictEqual(walker.next(), 1)
            assert.strictEqual(walker.next(), 2)
            assert.strictEqual(walker.next(), 3)

            // Wrap to second row
            assert.strictEqual(walker.next(), 4)

            // Move to end of grid
            for (let i = 0; i < 11; i++) walker.next()
            assert.strictEqual(walker.getIndex(), 15)

            // Wrap to beginning
            assert.strictEqual(walker.next(), 0)
        })

        test('zigzag pattern traversal', () => {
            const walker = new GridWalker('zigzag')
            assert.strictEqual(walker.getIndex(), 0)

            // Row 0 (L->R): 0, 1, 2, 3
            assert.strictEqual(walker.next(), 1)
            assert.strictEqual(walker.next(), 2)
            assert.strictEqual(walker.next(), 3)

            // Row 1 (R->L): 7, 6, 5, 4
            assert.strictEqual(walker.next(), 7)
            assert.strictEqual(walker.next(), 6)
            assert.strictEqual(walker.next(), 5)
            assert.strictEqual(walker.next(), 4)

            // Row 2 (L->R): 8, 9, 10, 11
            assert.strictEqual(walker.next(), 8)
            assert.strictEqual(walker.next(), 9)
            assert.strictEqual(walker.next(), 10)
            assert.strictEqual(walker.next(), 11)

            // Row 3 (R->L): 15, 14, 13, 12
            assert.strictEqual(walker.next(), 15)
            assert.strictEqual(walker.next(), 14)
            assert.strictEqual(walker.next(), 13)
            assert.strictEqual(walker.next(), 12)

            // Wrap to Row 0
            assert.strictEqual(walker.next(), 0)
        })

        test('spiral pattern traversal', () => {
            const walker = new GridWalker('spiral')
            const expectedPath = [
                0, 1, 2, 3,
                7, 11, 15, 14,
                13, 12, 8, 4,
                5, 6, 10, 9
            ]

            assert.strictEqual(walker.getIndex(), expectedPath[0])
            for (let i = 1; i < expectedPath.length; i++) {
                assert.strictEqual(walker.next(), expectedPath[i])
            }
            // Wrap
            assert.strictEqual(walker.next(), expectedPath[0])
        })

        test('random pattern traversal stays in bounds', () => {
            const walker = new GridWalker('random')
            for (let i = 0; i < 100; i++) {
                const index = walker.next()
                assert.ok(index >= 0 && index < 16)
            }
        })
    })

    describe('Static Methods', () => {
        test('getPatternPath returns 16 steps', () => {
            const patterns: (SnakePattern | 'cartesian')[] = ['linear', 'zigzag', 'spiral', 'cartesian']
            for (const p of patterns) {
                const path = GridWalker.getPatternPath(p)
                assert.strictEqual(path.length, 16)
                if (p === 'cartesian') {
                    assert.deepStrictEqual(path, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
                }
            }
        })

        test('getNextIndex matches pattern logic', () => {
            assert.strictEqual(GridWalker.getNextIndex(3, 'linear'), 4)
            assert.strictEqual(GridWalker.getNextIndex(15, 'linear'), 0)

            assert.strictEqual(GridWalker.getNextIndex(3, 'zigzag'), 7)
            assert.strictEqual(GridWalker.getNextIndex(7, 'zigzag'), 6)
            assert.strictEqual(GridWalker.getNextIndex(4, 'zigzag'), 8)

            assert.strictEqual(GridWalker.getNextIndex(3, 'spiral'), 7)
            assert.strictEqual(GridWalker.getNextIndex(9, 'spiral'), 0)
        })

        test('getNextCartesian handles modes', () => {
            assert.deepStrictEqual(GridWalker.getNextCartesian(0, 0, 'x'), { x: 1, y: 0 })
            assert.deepStrictEqual(GridWalker.getNextCartesian(0, 0, 'y'), { x: 0, y: 1 })
            assert.deepStrictEqual(GridWalker.getNextCartesian(0, 0, 'both'), { x: 1, y: 1 })

            // Wrapping
            assert.deepStrictEqual(GridWalker.getNextCartesian(3, 3, 'x'), { x: 0, y: 3 })
            assert.deepStrictEqual(GridWalker.getNextCartesian(3, 3, 'y'), { x: 3, y: 0 })
            assert.deepStrictEqual(GridWalker.getNextCartesian(3, 3, 'both'), { x: 0, y: 0 })
        })
    })

    describe('State Management', () => {
        test('setPattern changes behavior', () => {
            const walker = new GridWalker('linear')
            assert.strictEqual(walker.next(), 1)

            walker.setPattern('zigzag')
            // currently at index 1 (x=1, y=0). In zigzag row 0 moves L->R.
            assert.strictEqual(walker.next(), 2)

            // Move to row 1
            walker.next() // 3
            assert.strictEqual(walker.next(), 7)
        })

        test('getIndex returns current y*4 + x', () => {
            const walker = new GridWalker()
            walker.x = 2
            walker.y = 1
            assert.strictEqual(walker.getIndex(), 6)
        })
    })
})
