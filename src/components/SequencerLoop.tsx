import { useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { useAudioStore } from '../store/audioStore'
import { useLfoModulator } from '../hooks/sequencers/useLfoModulator'
import { useDrumSequencer } from '../hooks/sequencers/useDrumSequencer'
import { useBassSequencer } from '../hooks/sequencers/useBassSequencer'
import { useLeadSequencer } from '../hooks/sequencers/useLeadSequencer'
import { useHarmSequencer } from '../hooks/sequencers/useHarmSequencer'
import { usePadSequencer } from '../hooks/sequencers/usePadSequencer'
import { useMetronome } from '../hooks/sequencers/useMetronome'

/**
 * SequencerLoop — The central time management component.
 * Extracts and coordinates various sequencer ticks using specialized hooks.
 */
export function SequencerLoop() {
    // Access audio engine components from the store
    const bassSynth = useAudioStore(s => s.bassSynth)
    const fmBass = useAudioStore(s => s.fmBass)
    const leadSynth = useAudioStore(s => s.leadSynth)
    const drumMachine = useAudioStore(s => s.drumMachine)
    const padSynth = useAudioStore(s => s.padSynth)
    const harmSynth = useAudioStore(s => s.harmSynth)
    const isInitialized = useAudioStore(s => s.isInitialized)

    const stepRef = useRef(0)

    // Initialize Sequencer Hooks (extracted logic)
    const lfoTick = useLfoModulator()
    const drumTick = useDrumSequencer()
    const bassTick = useBassSequencer()
    const leadTick = useLeadSequencer()
    const harmTick = useHarmSequencer()
    const padTick = usePadSequencer()
    const metronomeTick = useMetronome()

    useEffect(() => {
        // Only start the loop if the audio engine is fully initialized and all synths are ready
        if (!isInitialized || !bassSynth || !fmBass || !leadSynth || !drumMachine || !harmSynth) return

        const loop = new Tone.Loop((time) => {
            const step = stepRef.current % 16
            const totalStep = stepRef.current

            // 0. Update LFO & Modulation
            lfoTick(time)

            // 1. Drums (Euclidean)
            drumTick(time, step)

            // Metronome logic
            metronomeTick(time, step)

            // 2. Bass (Acid/FM)
            bassTick(time, step)

            // 3. Lead Sequencers (ML-185, Snake, Turing)
            leadTick(time, step)

            // 3d. Harmony Sequencer
            harmTick(time, totalStep)

            // 4. Pads progression
            padTick(time, totalStep)

            // Synchronize UI step counter with audio timing
            Tone.Draw.schedule(() => {
                useAudioStore.getState().setCurrentStep(step)
            }, time)

            stepRef.current++
        }, '16n')

        // Start the master loop
        loop.start(0)

        return () => {
            // Cleanup: stop and dispose the loop when component unmounts
            loop.dispose()
        }
    }, [
        isInitialized,
        bassSynth, fmBass, leadSynth, drumMachine, harmSynth, padSynth,
        lfoTick, drumTick, bassTick, leadTick, harmTick, padTick, metronomeTick
    ])

    return null
}
