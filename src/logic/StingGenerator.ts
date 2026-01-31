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
    seedA: number = 0,
    seedB: number = 1,
    morph: number = 0
): BassStep[] {
    const steps: BassStep[] = []

    // 1. Scale mapping based on 'type'
    let scaleNotes: string[] = []
    const scaleObj = Scale.get(`${root} ${scale}`)
    const fullScale = scaleObj ? scaleObj.notes : []

    if (type < 0.3) {
        scaleNotes = fullScale.filter((_, i) => [0, 2, 4].includes(i))
    } else if (type < 0.7) {
        scaleNotes = fullScale
    } else {
        const chromaticScale = Scale.get(`${root} chromatic`)
        scaleNotes = chromaticScale?.notes || []
    }

    if (scaleNotes.length === 0) scaleNotes = [root || 'C']

    // Pseudo-random weight based on seed
    const getWeight = (i: number, s: number) => {
        const x = Math.sin(s + i * 13.37) * 10000
        return x - Math.floor(x)
    }

    for (let i = 0; i < 16; i++) {
        // Morph weights between seedA and seedB
        const weightA = getWeight(i, seedA)
        const weightB = getWeight(i, seedB)
        const weight = weightA * (1 - morph) + weightB * morph

        const active = weight < density

        // Choose note
        let noteName = root || 'C'
        if (active && scaleNotes.length > 0) {
            const nwA = getWeight(i + 16, seedA)
            const nwB = getWeight(i + 16, seedB)
            const noteWeight = nwA * (1 - morph) + nwB * morph
            const noteIdx = Math.floor(noteWeight * scaleNotes.length)
            noteName = scaleNotes[noteIdx] || root || 'C'
        }

        const swA = getWeight(i + 32, seedA)
        const swB = getWeight(i + 32, seedB)
        const slideWeight = swA * (1 - morph) + swB * morph
        const slide = active && slideWeight < (type * 0.5)

        const awA = getWeight(i + 48, seedA)
        const awB = getWeight(i + 48, seedB)
        const accentWeight = awA * (1 - morph) + awB * morph
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
