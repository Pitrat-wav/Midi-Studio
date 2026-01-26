import MidiWriter from 'midi-writer-js'
import { BassStep } from './StingGenerator'
import { Stage } from '../store/instrumentStore'
import * as Tone from 'tone'

export function exportToMidi(
    bpm: number,
    drums: { kick: number[], snare: number[], hihat: number[], hihatOpen: number[], clap: number[] },
    bassPattern: BassStep[],
    stages: Stage[],
    snakeGrid: number[],
    snakePattern: string,
    pads: { notes: string[], active: boolean }
): Uint8Array {
    const track1 = new MidiWriter.Track()
    // @ts-ignore
    track1.setTempo(bpm)
    track1.addTrackName('Acid Bass')

    const track2 = new MidiWriter.Track()
    track2.addTrackName('Drums')

    const track3 = new MidiWriter.Track()
    track3.addTrackName('Lead (ML-185)')

    const track4 = new MidiWriter.Track()
    track4.addTrackName('Ambient Pads')

    // 1. Bass Track (4 bars)
    for (let bar = 0; bar < 4; bar++) {
        bassPattern.forEach((step) => {
            if (step.active) {
                track1.addEvent(new MidiWriter.NoteEvent({
                    pitch: [step.note] as any,
                    duration: step.slide ? '8' : '16',
                    velocity: step.accent ? 127 : 90,
                    sequential: true
                }))
            } else {
                track1.addEvent(new MidiWriter.NoteEvent({
                    pitch: [],
                    duration: '16',
                    sequential: true
                }))
            }
        })
    }

    // 2. Drums Track (4 bars)
    for (let bar = 0; bar < 4; bar++) {
        for (let step = 0; step < 16; step++) {
            const notes = []
            if (drums.kick[step]) notes.push('C1')
            if (drums.snare[step]) notes.push('D1')
            if (drums.hihat[step]) notes.push('F#1')
            if (drums.hihatOpen[step]) notes.push('A#1')
            if (drums.clap[step]) notes.push('D#1')

            track2.addEvent(new MidiWriter.NoteEvent({
                pitch: notes as any,
                duration: '16',
                sequential: true
            }))
        }
    }

    // 3. Lead Track (ML-185 Simulation - 4 bars / 64 pulses)
    let currentSnakeIdx = 0
    let pulsesUsed = 0
    const totalPulses = 64

    while (pulsesUsed < totalPulses) {
        for (const stage of stages) {
            if (pulsesUsed >= totalPulses) break

            const stageLengthIn16th = stage.length * stage.pulseCount
            const midiNote = snakeGrid[currentSnakeIdx % 16]
            const noteName = Tone.Frequency(midiNote, 'midi').toNote()
            const pitch = [noteName] as any

            if (stage.gateMode === 0) { // Mute
                track3.addEvent(new MidiWriter.NoteEvent({ pitch: [], duration: (stageLengthIn16th).toString() as any, sequential: true }))
            } else if (stage.gateMode === 1) { // Single
                track3.addEvent(new MidiWriter.NoteEvent({ pitch, duration: (stageLengthIn16th).toString() as any, velocity: Math.floor(stage.velocity * 127), sequential: true }))
            } else if (stage.gateMode === 2) { // Multi
                for (let p = 0; p < stageLengthIn16th; p++) {
                    track3.addEvent(new MidiWriter.NoteEvent({ pitch, duration: '16', velocity: Math.floor(stage.velocity * 127), sequential: true }))
                }
            } else if (stage.gateMode === 3) { // Hold
                track3.addEvent(new MidiWriter.NoteEvent({ pitch, duration: (stageLengthIn16th).toString() as any, velocity: Math.floor(stage.velocity * 127), sequential: true }))
            }

            pulsesUsed += stageLengthIn16th
            currentSnakeIdx++
        }
    }

    // 4. Pads Track
    if (pads.active) {
        for (let i = 0; i < 4; i++) {
            track4.addEvent(new MidiWriter.NoteEvent({
                pitch: pads.notes as any,
                duration: '1',
                sequential: true,
                velocity: 50
            }))
        }
    }

    const write = new MidiWriter.Writer([track1, track2, track3, track4])
    return write.buildFile()
}
