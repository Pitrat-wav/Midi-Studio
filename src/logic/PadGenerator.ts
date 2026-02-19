import { Scale } from '@tonaljs/tonal'
import { ScaleType } from '../store/instrumentStore'

export function generatePadProgression(root: string, scaleType: ScaleType, complexity: number): string[][] {
    const scaleName = `${root} ${scaleType}`
    const scale = Scale.get(scaleName)
    const notes = scale ? scale.notes : []

    if (!notes || notes.length < 5) return [[root + '3', root + '4']]

    // Basic progression degrees: I, IV, V, I (can be more complex based on complexity)
    const progressionDegrees = [0, 3, 4, 0]

    return progressionDegrees.map(degree => {
        const chordRoot = notes[degree % notes.length]
        const base = chordRoot + '3'
        // Find 3rd and 5th relative to chord root in scale
        const third = notes[(degree + 2) % notes.length] + '3'
        const fifth = notes[(degree + 4) % notes.length] + '3'

        const chord = [base, third, fifth]

        if (complexity > 0.6) {
            chord.push(notes[(degree + 6) % notes.length] + '4')
        }

        return chord
    })
}
