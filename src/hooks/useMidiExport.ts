import { useState } from 'react'
import { useDrumStore, useBassStore, usePadStore, useHarmonyStore, useSequencerStore, useHarmStore } from '../store/instrumentStore'
import { useAudioStore } from '../store/audioStore'
import { exportToMidi } from '../logic/MidiExporter'
import { bjorklund } from '../logic/bjorklund'

export function useMidiExport() {
    const [isExporting, setIsExporting] = useState(false)
    const drums = useDrumStore()
    const bass = useBassStore()
    const seq = useSequencerStore()
    const harmony = useHarmonyStore()
    const pad = usePadStore()
    const harm = useHarmStore()
    const { bpm } = useAudioStore()

    const exportMidi = async (target: 'drums' | 'bass' | 'seq185' | 'snake' | 'pads' | 'harm' | 'turing') => {
        if (!window.Telegram?.WebApp) return
        setIsExporting(true)

        try {
            const patterns = {
                kick: bjorklund(drums.kick.steps, drums.kick.pulses),
                snare: bjorklund(drums.snare.steps, drums.snare.pulses),
                hihat: bjorklund(drums.hihat.steps, drums.hihat.pulses),
                hihatOpen: bjorklund(drums.hihatOpen.steps, drums.hihatOpen.pulses),
                clap: bjorklund(drums.clap.steps, drums.clap.pulses)
            }

            const midiData = exportToMidi(
                bpm,
                patterns,
                bass.pattern,
                seq.stages,
                seq.snakeGrid,
                seq.snakePattern,
                { notes: [harmony.root + '3'], active: pad.active },
                harm.grid,
                target,
                { enabled: seq.smartChordEnabled, type: seq.smartChordType },
                seq.turingRegister,
                seq.turingBits
            )
            const base64Midi = btoa(String.fromCharCode(...midiData))

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

            const response = await fetch(`${API_URL}/upload-midi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    initData: window.Telegram.WebApp.initData,
                    midiBase64: base64Midi,
                    filename: `midi_${target}_${Date.now()}.mid`
                })
            })

            if (response.ok) {
                window.Telegram.WebApp.showAlert('MIDI файл отправлен в чат! 🎹')
            } else {
                throw new Error('Server error')
            }
        } catch (err) {
            console.error(err)
            window.Telegram.WebApp.showAlert('Ошибка экспорта. Убедитесь, что сервер запущен.')
        } finally {
            setIsExporting(false)
        }
    }

    return { exportMidi, isExporting }
}
