import { useAudioStore } from '../store/audioStore'
import { useBassStore, useDrumStore, useHarmonyStore, usePadStore } from '../store/instrumentStore'
import { useVisualStore } from '../store/visualStore'

export interface CommandResponse {
    success: boolean
    message: string
}

export const parseCommand = (input: string): CommandResponse => {
    const parts = input.trim().toLowerCase().split(/\s+/)
    if (parts.length === 0 || parts[0] === '') return { success: false, message: '' }

    const cmd = parts[0]
    const args = parts.slice(1)

    try {
        switch (cmd) {
            case 'help':
                return {
                    success: true,
                    message: 'Доступные команды: bpm, play, stop, bass.cutoff, bass.res, drums.kick.pulses, pads.bright, harmony.root, harmony.scale'
                }

            case 'bpm':
                if (args.length === 0) return { success: false, message: `Текущий BPM: ${useAudioStore.getState().bpm}` }
                const bpm = parseFloat(args[0])
                if (isNaN(bpm)) return { success: false, message: 'Ошибка: BPM должен быть числом' }
                useAudioStore.getState().setBpm(bpm)
                return { success: true, message: `BPM установлен на ${bpm}` }

            case 'play':
                if (!useAudioStore.getState().isPlaying) useAudioStore.getState().togglePlay()
                return { success: true, message: 'Воспроизведение запущено' }

            case 'stop':
                if (useAudioStore.getState().isPlaying) useAudioStore.getState().togglePlay()
                return { success: true, message: 'Воспроизведение остановлено' }

            // BASS
            case 'bass.cutoff':
                if (args.length === 0) return { success: false, message: `Bass Cutoff: ${useBassStore.getState().cutoff}` }
                const co = parseFloat(args[0])
                useBassStore.getState().setParams({ cutoff: co })
                return { success: true, message: `Bass Cutoff: ${co}` }

            case 'bass.res':
                if (args.length === 0) return { success: false, message: `Bass Resonance: ${useBassStore.getState().resonance}` }
                const res = parseFloat(args[0])
                useBassStore.getState().setParams({ resonance: res })
                return { success: true, message: `Bass Resonance: ${res}` }

            // DRUMS
            case 'drums.kick.pulses':
                const kpulses = parseInt(args[0])
                useDrumStore.getState().setParams('kick', { pulses: kpulses })
                return { success: true, message: `Kick Pulses: ${kpulses}` }

            case 'drums.snare.pulses':
                const spulses = parseInt(args[0])
                useDrumStore.getState().setParams('snare', { pulses: spulses })
                return { success: true, message: `Snare Pulses: ${spulses}` }

            case 'drums.hihat.pulses':
                const hpulses = parseInt(args[0])
                useDrumStore.getState().setParams('hihat', { pulses: hpulses })
                return { success: true, message: `HiHat Pulses: ${hpulses}` }

            // PADS
            case 'pads.bright':
                const bright = parseFloat(args[0])
                usePadStore.getState().setParams({ brightness: bright })
                return { success: true, message: `Pads Brightness: ${bright}` }

            // HARMONY
            case 'harmony.root':
                const root = args[0].toUpperCase()
                useHarmonyStore.getState().setRoot(root)
                return { success: true, message: `Root: ${root}` }

            case 'harmony.scale':
                const scale = args[0] as any
                useHarmonyStore.getState().setScale(scale)
                return { success: true, message: `Scale: ${scale}` }

            default:
                // Try dynamic mapping if it looks like a store parameter
                // This is a placeholder for more advanced dynamic mapping
                return { success: false, message: `Неизвестная команда: ${cmd}` }
        }
    } catch (e) {
        return { success: false, message: `Ошибка выполнения: ${e}` }
    }
}
