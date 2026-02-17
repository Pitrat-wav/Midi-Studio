import * as Tone from 'tone'
import { useAudioStore } from '../store/audioStore'
import { useDrumStore, useBassStore, usePadStore, useHarmStore, useHarmonyStore, useSequencerStore } from '../store/instrumentStore'
import { useArrangementStore } from '../store/arrangementStore'
import { useVisualStore } from '../store/visualStore'
import { generatePadProgression } from './PadGenerator'

// VERSION: v2.0 - без Scaler, прямой вызов MIDI нот

let loopInstance: Tone.Loop | null = null
let stepCounter = 0
let stagePulse = 0

// --- HELPERS ---

function getInterpolatedValue(arrange: any, trackId: string, param: string, currentTick: number, defaultValue: number) {
    const trackAuto = arrange.automations[trackId] || {}
    const points = trackAuto[param] || []
    if (points.length === 0) return defaultValue
    if (points.length === 1) return points[0].value

    const nextIdx = points.findIndex((p: any) => p.tick > currentTick)
    if (nextIdx === -1) return points[points.length - 1].value
    if (nextIdx === 0) return points[0].value

    const p1 = points[nextIdx - 1]
    const p2 = points[nextIdx]
    const ratio = (currentTick - p1.tick) / (p2.tick - p1.tick)
    return p1.value + (p2.value - p1.value) * ratio
}

function isTrackActive(arrange: any, trackId: string, anySolo: boolean) {
    const settings = arrange.tracks[trackId] || { mute: false, solo: false, volume: 0.8 }
    if (anySolo) return settings.solo
    return !settings.mute
}

// --- PROCESSING BLOCKS ---

function processArrangementPlayback(totalStep: number, arrange: any, visual: any) {
    if (visual.appView === 'ARRANGE') {
        const { clips } = arrange
        const startingClips = clips.filter((c: any) => c.startTick === totalStep)

        if (startingClips.length > 0) {
            startingClips.forEach((clip: any) => {
                console.log(`⏱️ Arrangement: Triggering ${clip.trackId} snapshot ${clip.snapshotId}`)
                useAudioStore.getState().triggerSnapshot(clip.trackId, clip.snapshotId)
            })
            // Commit arrangement clips immediately at their start step
            useAudioStore.getState().commitSnapshots()
        }
    }
}

function processDrums(time: Tone.Unit.Time, step: number, totalStep: number, arrange: any, anySolo: boolean, drums: any, drumMachine: any) {
    const drumSettings = arrange.tracks?.drums || { mute: false, solo: false, volume: 0.8 }
    const autoVolDrums = getInterpolatedValue(arrange, 'drums', 'volume', totalStep, drumSettings.volume)

    if (drums.isPlaying && drumMachine && isTrackActive(arrange, 'drums', anySolo)) {
        const patterns = drums.activePatterns

        if (drumMachine.output) {
            drumMachine.output.volume.value = Tone.gainToDb(autoVolDrums)
        }

        if (patterns.kick[step] && !drums.kick.muted) {
            drumMachine.triggerDrum('kick', time)
        }
        if (patterns.snare[step] && !drums.snare.muted) {
            drumMachine.triggerDrum('snare', time)
        }
        if (patterns.hihat[step] && !drums.hihat.muted) {
            drumMachine.triggerDrum('hihat', time)
        }
        if (patterns.hihatOpen[step] && !drums.hihatOpen.muted) {
            drumMachine.triggerDrum('hihatOpen', time)
        }
        if (patterns.clap[step] && !drums.clap.muted) {
            drumMachine.triggerDrum('clap', time)
        }
        if (patterns.ride[step] && !drums.ride.muted) {
            drumMachine.triggerDrum('ride', time)
        }
    }
}

function processBass(time: Tone.Unit.Time, step: number, totalStep: number, arrange: any, anySolo: boolean, bass: any, bassSynth: any, fmBass: any) {
    const bassSettings = arrange.tracks?.bass || { mute: false, solo: false, volume: 0.8 }
    const autoVolBass = getInterpolatedValue(arrange, 'bass', 'volume', totalStep, bassSettings.volume)

    if (bass.isPlaying && isTrackActive(arrange, 'bass', anySolo)) {
        const bassStep = bass.pattern[step]
        const prevBassStep = bass.pattern[(step + 15) % 16]

        if (bassStep && bassStep.active) {
            if (bass.activeInstrument === 'acid' && bassSynth) {
                if (bassSynth.outputGain) {
                    bassSynth.outputGain.volume.value = Tone.gainToDb(autoVolBass)
                }
                const isContinuing = prevBassStep?.active && prevBassStep?.slide
                bassSynth.triggerNote(
                    bassStep.note,
                    '16n',
                    time,
                    bassStep.velocity,
                    bassStep.slide,
                    bassStep.accent,
                    !!isContinuing
                )
            } else if (bass.activeInstrument === 'fm' && fmBass) {
                fmBass.triggerNote(bassStep.note, '16n', time, bassStep.velocity)
            }
        }
    }
}

function processLead(time: Tone.Unit.Time, step: number, totalStep: number, arrange: any, anySolo: boolean, seq: any, leadSynth: any) {
    const leadSettings = arrange.tracks?.lead || { mute: false, solo: false, volume: 0.8 }
    const autoVolLead = getInterpolatedValue(arrange, 'lead', 'volume', totalStep, leadSettings.volume)

    if (leadSynth && isTrackActive(arrange, 'lead', anySolo)) {
        // Apply volume
        if (leadSynth.outputGain) {
            leadSynth.outputGain.volume.value = Tone.gainToDb(autoVolLead)
        }

        if (seq.isStagesPlaying) {
            try {
                const stageIndex = seq.currentStageIndex || 0
                const stage = seq.stages[stageIndex]

                if (!stage) {
                    if (step === 0) console.log(`    ⚠️ No stage at index ${stageIndex}`)
                } else {
                    // Логируем stage info
                    if (step === 0) {
                        console.log(`    Stage ${stageIndex}: pitch=${stage.pitch}, velocity=${stage.velocity}, pulseCount=${stage.pulseCount}, pulse=${stagePulse}`)
                    }

                    // Триггер на начале каждого pulse
                    if (stagePulse === 0) {
                        const midiNote = stage.pitch || 60
                        const noteName = Tone.Frequency(midiNote, 'midi').toNote()

                        leadSynth.triggerNote(noteName, '16n', time, stage.velocity || 0.8)
                        console.log(`    ✅ LEAD note: ${noteName} (${midiNote})`)
                    }

                    // Продвигаем pulse
                    stagePulse = (stagePulse + 1) % (stage.pulseCount || 4)
                }
            } catch (e) {
                console.error('  ❌ Lead error:', e)
            }
        }
    }
}

function processPads(time: Tone.Unit.Time, totalStep: number, arrange: any, anySolo: boolean, pads: any, padSynth: any, harmony: any) {
    const padSettings = arrange.tracks?.pads || { mute: false, solo: false, volume: 0.8 }
    const autoVolPads = getInterpolatedValue(arrange, 'pads', 'volume', totalStep, padSettings.volume)

    if (pads.active && padSynth && totalStep % 32 === 0 && isTrackActive(arrange, 'pads', anySolo)) {
        try {
            if (padSynth.synth) {
                padSynth.synth.volume.value = Tone.gainToDb(autoVolPads)
            }
            const progression = generatePadProgression(
                harmony.root,
                harmony.scale,
                pads.complexity
            )
            if (progression && progression.length > 0) {
                const chordIdx = Math.floor((totalStep / 32) % progression.length)
                padSynth.triggerChord(progression[chordIdx], '2n', time)
                console.log('  🎹 PADS triggered')
            }
        } catch (e) {
            console.error('Pads trigger failed:', e)
        }
    }
}

function processHarm(time: Tone.Unit.Time, totalStep: number, arrange: any, anySolo: boolean, harm: any, harmSynth: any, harmony: any) {
    const harmSettings = arrange.tracks?.harm || { mute: false, solo: false, volume: 0.8 }
    const autoVolHarm = getInterpolatedValue(arrange, 'harm', 'volume', totalStep, harmSettings.volume)

    if (harm.isPlaying && harmSynth && totalStep % 32 === 0 && isTrackActive(arrange, 'harm', anySolo)) {
        try {
            if (harmSynth.outputGain) {
                harmSynth.outputGain.volume.value = Tone.gainToDb(autoVolHarm)
            }
            const rootNote = harmony.root + '2'
            harmSynth.triggerNote(rootNote, '2n', time, 0.7)
            console.log('  🔮 HARM triggered')
        } catch (e) {
            console.error('Harm trigger failed:', e)
        }
    }
}

export function startSequencerLoop() {
    if (loopInstance) {
        console.warn('⚠️ Loop already running!')
        return
    }

    console.log('🚀 STARTING GLOBAL SEQUENCER LOOP v2.0 (NO SCALER)')

    loopInstance = new Tone.Loop((time) => {
        const step = stepCounter % 16
        const totalStep = stepCounter

        // Лог раз в такт + Коммит снапшотов
        if (step === 0) {
            const bar = Math.floor(totalStep / 16)
            console.log(`🎹 Bar ${bar}, Transport: ${Tone.Transport.state}`)
            useAudioStore.getState().commitSnapshots()
        }

        // Получаем состояния и инструменты
        const visual = useVisualStore.getState()
        const arrange = useArrangementStore.getState()
        const { drumMachine, bassSynth, fmBass, leadSynth, padSynth, harmSynth } = useAudioStore.getState()

        const drums = useDrumStore.getState()
        const bass = useBassStore.getState()
        const pads = usePadStore.getState()
        const harm = useHarmStore.getState()
        const harmony = useHarmonyStore.getState()
        const seq = useSequencerStore.getState()

        const anySolo = Object.values(arrange.tracks).some(t => t.solo)

        // 1. ARRANGEMENT
        processArrangementPlayback(totalStep, arrange, visual)

        // 2. DRUMS
        processDrums(time, step, totalStep, arrange, anySolo, drums, drumMachine)

        // 3. BASS
        processBass(time, step, totalStep, arrange, anySolo, bass, bassSynth, fmBass)

        // 4. LEAD (Stages Sequencer)
        processLead(time, step, totalStep, arrange, anySolo, seq, leadSynth)

        // 5. PADS
        processPads(time, totalStep, arrange, anySolo, pads, padSynth, harmony)

        // 6. HARM SYNTH
        processHarm(time, totalStep, arrange, anySolo, harm, harmSynth, harmony)

        // Sync UI step counter
        Tone.Draw.schedule(() => {
            useAudioStore.getState().setCurrentStep(step)
        }, time)

        stepCounter++
    }, '16n')

    loopInstance.start(0)
    console.log('✅ LOOP STARTED')
    console.log('   Transport state:', Tone.Transport.state)
    console.log('   Transport BPM:', Tone.Transport.bpm.value)
}

export function stopSequencerLoop() {
    console.log('🛑 STOPPING SEQUENCER LOOP')
    if (loopInstance) {
        loopInstance.dispose()
        loopInstance = null
    }
    stepCounter = 0
    stagePulse = 0
}
