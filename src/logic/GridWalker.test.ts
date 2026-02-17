import { test, describe } from 'node:test'
import assert from 'node:assert'
import { GridWalker } from './GridWalker'

describe('GridWalker', () => {
    describe('Linear Pattern', () => {
        test('should traverse linearly and wrap correctly', () => {
            const walker = new GridWalker('linear')
            assert.strictEqual(walker.getIndex(), 0)

            // Move through first row
            assert.strictEqual(walker.next(), 1)
            assert.strictEqual(walker.next(), 2)
            assert.strictEqual(walker.next(), 3)

            // Wrap to second row
            assert.strictEqual(walker.next(), 4)
            assert.strictEqual(walker.x, 0)
            assert.strictEqual(walker.y, 1)

            // Move to end of grid
            for (let i = 0; i < 11; i++) walker.next()
            assert.strictEqual(walker.getIndex(), 15)

            // Wrap to start
            assert.strictEqual(walker.next(), 0)
            assert.strictEqual(walker.x, 0)
            assert.strictEqual(walker.y, 0)
        })
    })

    describe('ZigZag Pattern', () => {
        test('should traverse in zigzag pattern', () => {
            const walker = new GridWalker('zigzag')

            // Row 0 (L -> R): 0, 1, 2, 3
            assert.strictEqual(walker.getIndex(), 0)
            assert.strictEqual(walker.next(), 1)
            assert.strictEqual(walker.next(), 2)
            assert.strictEqual(walker.next(), 3)

            // Transition to Row 1: (3,0) -> (3,1) which is index 7
            assert.strictEqual(walker.next(), 7)

            // Row 1 (R -> L): 7, 6, 5, 4
            assert.strictEqual(walker.next(), 6)
            assert.strictEqual(walker.next(), 5)
            assert.strictEqual(walker.next(), 4)

            // Transition to Row 2: (0,1) -> (0,2) which is index 8
            assert.strictEqual(walker.next(), 8)

            // Row 2 (L -> R): 8, 9, 10, 11
            assert.strictEqual(walker.next(), 9)
            assert.strictEqual(walker.next(), 10)
            assert.strictEqual(walker.next(), 11)

            // Transition to Row 3: (3,2) -> (3,3) which is index 15
            assert.strictEqual(walker.next(), 15)

            // Row 3 (R -> L): 15, 14, 13, 12
            assert.strictEqual(walker.next(), 14)
            assert.strictEqual(walker.next(), 13)
            assert.strictEqual(walker.next(), 12)

            // Wrap to Row 0: (0,3) -> (0,0) which is index 0
            assert.strictEqual(walker.next(), 0)
        })
    })

    describe('Spiral Pattern', () => {
        test('should traverse in spiral pattern', () => {
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
            // Should wrap
            assert.strictEqual(walker.next(), expectedPath[0])
        })
    })

    describe('Random Pattern', () => {
        test('should stay within bounds', () => {
            const walker = new GridWalker('random')
            for (let i = 0; i < 100; i++) {
                const idx = walker.next()
                assert.ok(idx >= 0 && idx < 16)
                assert.ok(walker.x >= 0 && walker.x < 4)
                assert.ok(walker.y >= 0 && walker.y < 4)
            }
        })
    })

    describe('Static Methods', () => {
        test('getPatternPath should return correct 16-step path', () => {
            const linearPath = GridWalker.getPatternPath('linear')
            assert.strictEqual(linearPath.length, 16)
            assert.strictEqual(linearPath[0], 0)
            assert.strictEqual(linearPath[15], 15)

            const cartesianPath = GridWalker.getPatternPath('cartesian')
            assert.deepStrictEqual(cartesianPath, Array.from({ length: 16 }, (_, i) => i))
        })

        test('getNextIndex should match pattern logic', () => {
            assert.strictEqual(GridWalker.getNextIndex(0, 'linear'), 1)
            assert.strictEqual(GridWalker.getNextIndex(3, 'linear'), 4)
            assert.strictEqual(GridWalker.getNextIndex(3, 'zigzag'), 7)
            assert.strictEqual(GridWalker.getNextIndex(7, 'zigzag'), 6)
            assert.strictEqual(GridWalker.getNextIndex(3, 'spiral'), 7)
        })

        test('getNextCartesian should increment correctly', () => {
            assert.deepStrictEqual(GridWalker.getNextCartesian(0, 0, 'x'), { x: 1, y: 0 })
            assert.deepStrictEqual(GridWalker.getNextCartesian(0, 0, 'y'), { x: 0, y: 1 })
            assert.deepStrictEqual(GridWalker.getNextCartesian(0, 0, 'both'), { x: 1, y: 1 })
            assert.deepStrictEqual(GridWalker.getNextCartesian(3, 3, 'both'), { x: 0, y: 0 })
        })
    })

    describe('State Management', () => {
        test('setPattern should update pattern and affect movement', () => {
            const walker = new GridWalker('linear')
            walker.setPattern('spiral')

            // At (3,0), linear would move to (0,1) = 4
            // Spiral moves to (3,1) = 7
            walker.x = 3
            walker.y = 0
            assert.strictEqual(walker.next(), 7)
        })

        test('getIndex should return correct index from coordinates', () => {
            const walker = new GridWalker()
            walker.x = 2
            walker.y = 1
            assert.strictEqual(walker.getIndex(), 6) // 1 * 4 + 2
        })
    })
})
