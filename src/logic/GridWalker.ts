export type SnakePattern = 'linear' | 'zigzag' | 'spiral' | 'random'

/**
 * GridWalker handles movement across a 4x4 matrix (16 cells).
 * It supports various traversal patterns (Linear, ZigZag, Spiral, Random).
 */
export class GridWalker {
    x: number = 0
    y: number = 0
    pattern: SnakePattern = 'linear'

    constructor(pattern: SnakePattern = 'linear') {
        this.pattern = pattern
    }

    static getNextIndex(currentIndex: number, pattern: SnakePattern): number {
        let x = currentIndex % 4
        let y = Math.floor(currentIndex / 4)

        switch (pattern) {
            case 'linear':
                x++
                if (x >= 4) { x = 0; y = (y + 1) % 4 }
                break
            case 'zigzag':
                if (y % 2 === 0) {
                    x++
                    if (x >= 4) { x = 3; y = (y + 1) % 4 }
                } else {
                    x--
                    if (x < 0) { x = 0; y = (y + 1) % 4 }
                }
                break
            case 'spiral':
                const spiralOrder = [
                    [0, 0], [1, 0], [2, 0], [3, 0],
                    [3, 1], [3, 2], [3, 3], [2, 3],
                    [1, 3], [0, 3], [0, 2], [0, 1],
                    [1, 1], [2, 1], [2, 2], [1, 2]
                ]
                const spiralIdx = spiralOrder.findIndex(p => p[0] === x && p[1] === y)
                const nextSpiral = spiralOrder[(spiralIdx + 1) % 16]
                x = nextSpiral[0]; y = nextSpiral[1]
                break
            case 'random':
                return Math.floor(Math.random() * 16)
        }
        return y * 4 + x
    }

    next(): number {
        switch (this.pattern) {
            case 'linear':
                this.moveLinear()
                break
            case 'zigzag':
                this.moveZigZag()
                break
            case 'spiral':
                this.moveSpiral()
                break
            case 'random':
                this.moveRandom()
                break
        }
        return this.getIndex()
    }

    getIndex(): number {
        return this.y * 4 + this.x
    }

    private moveLinear() {
        this.x++
        if (this.x >= 4) {
            this.x = 0
            this.y = (this.y + 1) % 4
        }
    }

    private moveZigZag() {
        if (this.y % 2 === 0) {
            this.x++
            if (this.x >= 4) {
                this.x = 3
                this.y = (this.y + 1) % 4
            }
        } else {
            this.x--
            if (this.x < 0) {
                this.x = 0
                this.y = (this.y + 1) % 4
            }
        }
    }

    private moveSpiral() {
        // Simplified spiral logic for 4x4
        const spiralOrder = [
            [0, 0], [1, 0], [2, 0], [3, 0],
            [3, 1], [3, 2], [3, 3], [2, 3],
            [1, 3], [0, 3], [0, 2], [0, 1],
            [1, 1], [2, 1], [2, 2], [1, 2]
        ]
        const currentIndex = spiralOrder.findIndex(p => p[0] === this.x && p[1] === this.y)
        const nextItem = spiralOrder[(currentIndex + 1) % 16]
        this.x = nextItem[0]
        this.y = nextItem[1]
    }

    private moveRandom() {
        this.x = Math.floor(Math.random() * 4)
        this.y = Math.floor(Math.random() * 4)
    }

    setPattern(pattern: SnakePattern) {
        this.pattern = pattern
    }
}
