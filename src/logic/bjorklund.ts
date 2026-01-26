/**
 * Bjorklund's algorithm for generating Euclidean rhythms.
 * Distributes 'k' pulses as evenly as possible over 'n' steps.
 */
export function bjorklund(steps: number, pulses: number): number[] {
    if (pulses <= 0) return new Array(steps).fill(0)
    if (pulses >= steps) return new Array(steps).fill(1)

    let pattern: any[] = []
    let counts: number[] = []
    let remainders: number[] = []
    let divisor = steps - pulses

    remainders.push(pulses)
    let level = 0

    while (true) {
        counts.push(Math.floor(divisor / remainders[level]))
        remainders.push(divisor % remainders[level])
        divisor = remainders[level]
        level++
        if (remainders[level] <= 1) break
    }

    counts.push(divisor)

    const buildPattern = (level: number) => {
        if (level === -1) {
            pattern.push(0)
        } else if (level === -2) {
            pattern.push(1)
        } else {
            for (let i = 0; i < counts[level]; i++) buildPattern(level - 1)
            if (remainders[level] !== 0) buildPattern(level - 2)
        }
    }

    buildPattern(level)

    // Bjorklund result might be flipped depending on implementation, 
    // ensuring the first step is usually a pulse if k > 0.
    let res = pattern.reverse()
    const firstOne = res.indexOf(1)
    if (firstOne !== -1) {
        res = [...res.slice(firstOne), ...res.slice(0, firstOne)]
    }

    // Slice or pad to match intended steps
    return res.slice(0, steps)
}

/**
 * Rotates an array by 'steps'.
 */
export function rotateArray<T>(arr: T[], steps: number): T[] {
    const n = arr.length
    const offset = ((steps % n) + n) % n
    return [...arr.slice(n - offset), ...arr.slice(0, n - offset)]
}
