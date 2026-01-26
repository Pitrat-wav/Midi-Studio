import { Scale } from '@tonaljs/tonal'
import { ScaleType } from '../store/instrumentStore'

export interface BassStep {
    note: string
    velocity: number
    slide: boolean
    accent: boolean
    active: boolean
}

/**
 * Sting-style bassline generator.
 * Density (0-1) controls probability of note being active.
 * Type (0-1) controls melody: tonal -> chromatic -> aural.
 */
export function generateBassPattern(
    density: number,
    type: number,
    root: string = 'C',
    scale: ScaleType = 'minor',
    octave: number = 2,
    seed?: number
): BassStep[] {
    const steps: BassStep[] = []

    // 1. Scale mapping based on 'type'
    let scaleNotes: string[] = []
    const fullScale = Scale.get(`${root} ${scale}`).notes

    if (type < 0.3) {
        // Strict Tonal: Root, 3rd, 5th
        scaleNotes = fullScale.filter((_, i) => [0, 2, 4].includes(i))
    } else if (type < 0.7) {
        // Diatonic: Full Scale
        scaleNotes = fullScale
    } else {
        // Acid/Atonal: Chromatic jumps (including notes outside scale)
        scaleNotes = Scale.get(`${root} chromatic`).notes
    }

    if (scaleNotes.length === 0) scaleNotes = [root]

    // 2. Generate 16 steps with stable seed/weights
    // Simple LCG-like pseudo-random based on seed
    const getWeight = (i: number, seed: number) => {
        const x = Math.sin(seed + i * 13.37) * 10000
        return x - Math.floor(x)
    }

    for (let i = 0; i < 16; i++) {
        const weight = getWeight(i, seed || Math.random())
        const active = weight < density

        // Choose note
        let noteName = root
        if (active) {
            // Note choice can also be somewhat stable if we use weight
            const noteIdx = Math.floor(getWeight(i + 16, seed || Math.random()) * scaleNotes.length)
            noteName = scaleNotes[noteIdx]
        }

        // Slide probability (higher if type is high)
        const slideWeight = getWeight(i + 32, seed || Math.random())
        const slide = active && slideWeight < (type * 0.5)

        // Вероятность акцента (выше на слабых долях)
        const accentWeight = getWeight(i + 48, seed || Math.random())
        const offBeatBias = (i % 2 === 1) ? 0.2 : 0
        const accent = active && accentWeight < (0.3 + offBeatBias)

        steps.push({
            note: `${noteName}${octave}`,
            velocity: accent ? 1.0 : 0.7,
            slide,
            accent,
            active
        })
    }

    return steps
}
