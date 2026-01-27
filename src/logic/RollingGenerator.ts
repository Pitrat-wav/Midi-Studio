import { BassStep } from './StingGenerator'

export type RollingMode = 'offbeat' | 'galloping' | 'syncopated' | 'random'

/**
 * Generates rhythmic bass patterns common in electronic music.
 */
export function generateRollingPattern(
    density: number,
    mode: RollingMode,
    root: string,
    scale: string,
    octave: number = 1
): BassStep[] {
    const pattern: BassStep[] = Array.from({ length: 16 }, () => ({
        note: `${root}${octave}`,
        velocity: 0.7,
        active: false,
        slide: false,
        accent: false
    }))

    switch (mode) {
        case 'offbeat':
            // Classic 1-and-2-and (trigs on 2, 4, 6... in 16ths)
            for (let i = 2; i < 16; i += 4) {
                pattern[i].active = true
            }
            break

        case 'galloping':
            // k-BBB (trigs on 2, 3, 4, 6, 7, 8...)
            for (let i = 0; i < 16; i++) {
                if (i % 4 !== 0) { // skip the downbeat (where the kick is)
                    pattern[i].active = true
                }
            }
            break

        case 'syncopated':
            // Algorithmic pattern based on density
            const seed = Math.random()
            for (let i = 0; i < 16; i++) {
                const prob = (i % 4 === 0) ? density * 0.2 : density
                if (Math.random() < prob) {
                    pattern[i].active = true
                    if (Math.random() < 0.3) pattern[i].accent = true
                }
            }
            break

        case 'random':
            for (let i = 0; i < 16; i++) {
                if (Math.random() < density) {
                    pattern[i].active = true
                }
            }
            break
    }

    return pattern
}
