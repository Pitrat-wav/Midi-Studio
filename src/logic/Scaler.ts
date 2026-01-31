import { Scale, Note, Collection } from '@tonaljs/tonal'

export type ChordType = 'triad' | '7th' | 'power' | 'sus2' | 'sus4'

export class Scaler {
    /**
     * Finds the scale degree of a note (1-indexed)
     */
    public static getScaleDegree(midi: number, root: string, scaleType: string): number | null {
        const scale = Scale.get(`${root} ${scaleType}`)
        if (!scale || !scale.notes || !scale.notes.length) return null

        const noteName = Note.pitchClass(Note.fromMidi(midi))
        const degree = scale.notes.indexOf(noteName)

        return degree === -1 ? null : degree + 1
    }

    /**
     * Generates a chord based on a root note and scale
     */
    public static generateChord(midi: number, root: string, scaleType: string, type: ChordType = 'triad'): number[] {
        const scale = Scale.get(`${root} ${scaleType}`)
        if (!scale || !scale.notes || !scale.notes.length) return [midi]

        const degree = this.getScaleDegree(midi, root, scaleType)
        if (degree === null) {
            // If note is chromatic (not in scale), just return the note for safety or snap it?
            // Snapping is better for "Schwarzonator" vibe
            const snappedMidi = this.snapToScale(midi, root, scaleType)
            return this.generateChord(snappedMidi, root, scaleType, type)
        }

        // Get all notes in scale across multiple octaves to pick from
        const octave = Math.floor(midi / 12) - 1
        const scaleNotes = scale.notes
        const chordDegrees: number[] = []

        switch (type) {
            case 'triad':
                chordDegrees.push(0, 2, 4) // Root, 3rd, 5th
                break
            case '7th':
                chordDegrees.push(0, 2, 4, 6) // Root, 3rd, 5th, 7th
                break
            case 'power':
                chordDegrees.push(0, 4, 7) // Root, 5th, Octave
                break;
            case 'sus2':
                chordDegrees.push(0, 1, 4) // Root, 2nd, 5th
                break
            case 'sus4':
                chordDegrees.push(0, 3, 4) // Root, 4th, 5th
                break
            default:
                chordDegrees.push(0, 2, 4)
        }

        const baseDegreeIndex = degree - 1
        return chordDegrees.map(d => {
            const index = baseDegreeIndex + d
            const noteName = scaleNotes[index % scaleNotes.length]
            const octaveOffset = Math.floor(index / scaleNotes.length)
            const finalMidi = Note.midi(`${noteName}${octave + octaveOffset}`)
            return finalMidi || midi
        })
    }

    /**
     * Snaps a chromatic note to the nearest scale note
     */
    public static snapToScale(midi: number, root: string, scaleType: string): number {
        const scale = Scale.get(`${root} ${scaleType}`)
        if (!scale || !scale.notes || !scale.notes.length) return midi

        const noteMidi = midi % 12
        const scaleMidis = scale.notes.map(n => Note.midi(n + '0')! % 12)

        let minDiff = 13
        let closest = scaleMidis[0]

        scaleMidis.forEach(sm => {
            const diff = Math.min(Math.abs(sm - noteMidi), 12 - Math.abs(sm - noteMidi))
            if (diff < minDiff) {
                minDiff = diff
                closest = sm
            }
        })

        return Math.floor(midi / 12) * 12 + closest
    }
}
