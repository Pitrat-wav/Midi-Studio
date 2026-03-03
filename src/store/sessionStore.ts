import { create } from 'zustand'
import * as Tone from 'tone'
import { useDrumStore, useBassStore, useHarmonyStore, usePadStore, useSamplerStore, useHarmStore } from './instrumentStore'

export type InstrumentId = 'drums' | 'bass' | 'harmony' | 'pads' | 'sampler' | 'harm'

export interface ClipData {
    pattern?: any[]
    params?: Record<string, any>
    kit?: string // for drums
    snapshot?: number // reference to original snapshot if needed
}

export interface SessionState {
    clips: Record<InstrumentId, (ClipData | null)[]>
    activeClips: Record<InstrumentId, number | null>
    pendingClips: Record<InstrumentId, number | null>

    // Actions
    captureClip: (instId: InstrumentId, slotIndex: number) => void
    triggerClip: (instId: InstrumentId, slotIndex: number) => void
    stopClip: (instId: InstrumentId) => void
    triggerScene: (sceneIndex: number) => void
}

const MAX_SCENES = 8

const getInitialClips = (): Record<InstrumentId, (ClipData | null)[]> => ({
    drums: Array(MAX_SCENES).fill(null),
    bass: Array(MAX_SCENES).fill(null),
    harmony: Array(MAX_SCENES).fill(null),
    pads: Array(MAX_SCENES).fill(null),
    sampler: Array(MAX_SCENES).fill(null),
    harm: Array(MAX_SCENES).fill(null),
})

export const useSessionStore = create<SessionState>((set, get) => ({
    clips: getInitialClips(),
    activeClips: { drums: null, bass: null, harmony: null, pads: null, sampler: null, harm: null },
    pendingClips: { drums: null, bass: null, harmony: null, pads: null, sampler: null, harm: null },

    captureClip: (instId, slotIndex) => {
        if (slotIndex < 0 || slotIndex >= MAX_SCENES) return
        let data: ClipData = {}

        switch (instId) {
            case 'drums':
                const dState = useDrumStore.getState()
                data = { pattern: JSON.parse(JSON.stringify(dState.activePatterns)), kit: dState.kit }
                break
            case 'bass':
                const bState = useBassStore.getState()
                // Bass has presets and active patterns in instrumentStore
                data = {
                    pattern: JSON.parse(JSON.stringify((bState as any).activePattern || [])),
                    params: (bState as any).presets?.[0] || {}
                }
                break
            case 'harmony':
                const hState = useHarmonyStore.getState()
                data = { params: { root: hState.root, scale: hState.scale } }
                break
            case 'pads':
                const pState = usePadStore.getState()
                data = { params: { brightness: pState.brightness, complexity: pState.complexity } }
                break
            case 'sampler':
                const sState = useSamplerStore.getState()
                data = { params: { volume: sState.volume } }
                break
            case 'harm':
                const hmState = useHarmStore.getState()
                // Harm usually has complex state
                data = { pattern: JSON.parse(JSON.stringify((hmState as any).pattern || [])) }
                break
        }

        set(state => {
            const newClips = { ...state.clips }
            newClips[instId][slotIndex] = data
            return { clips: newClips, activeClips: { ...state.activeClips, [instId]: slotIndex } }
        })
    },

    triggerClip: (instId, slotIndex) => {
        if (slotIndex < 0 || slotIndex >= MAX_SCENES) return
        const { clips, pendingClips } = get()
        if (!clips[instId][slotIndex]) return // Nothing captured at this slot
        if (pendingClips[instId] === slotIndex) return // Already pending

        set(state => ({
            pendingClips: { ...state.pendingClips, [instId]: slotIndex }
        }))

        // Quantized launch (next 1m)
        const launchTime = Tone.Transport.nextSubdivision('1m')

        Tone.Transport.scheduleOnce((time) => {
            Tone.Draw.schedule(() => {
                const clip = get().clips[instId][slotIndex]
                if (clip) {
                    // Inject data into relevant store
                    switch (instId) {
                        case 'drums':
                            useDrumStore.setState({ activePatterns: clip.pattern as any, kit: clip.kit as any })
                            break
                        case 'bass':
                            useBassStore.setState({ activePattern: clip.pattern } as any)
                            break
                        case 'harmony':
                            useHarmonyStore.setState({ ...clip.params })
                            break
                        case 'pads':
                            usePadStore.setState({ ...clip.params })
                            break
                        case 'sampler':
                            useSamplerStore.setState({ ...clip.params })
                            break
                        case 'harm':
                            useHarmStore.setState({ pattern: clip.pattern } as any)
                            break
                    }
                }

                set(state => ({
                    activeClips: { ...state.activeClips, [instId]: slotIndex },
                    pendingClips: { ...state.pendingClips, [instId]: null }
                }))
            }, time)
        }, launchTime)
    },

    stopClip: (instId) => {
        set(state => ({
            pendingClips: { ...state.pendingClips, [instId]: -1 } // -1 indicates pending stop
        }))

        const launchTime = Tone.Transport.nextSubdivision('1m')

        Tone.Transport.scheduleOnce((time) => {
            Tone.Draw.schedule(() => {
                // For stop, we might want to clear patterns or mute
                switch (instId) {
                    case 'drums':
                        // Simple way is to clear pattern or silence
                        break
                    // Add stop logic for other instruments
                }

                set(state => ({
                    activeClips: { ...state.activeClips, [instId]: null },
                    pendingClips: { ...state.pendingClips, [instId]: null }
                }))
            }, time)
        }, launchTime)
    },

    triggerScene: (sceneIndex) => {
        const instruments: InstrumentId[] = ['drums', 'bass', 'harmony', 'pads', 'sampler', 'harm']
        instruments.forEach(inst => {
            if (get().clips[inst][sceneIndex]) {
                get().triggerClip(inst, sceneIndex)
            }
        })
    }
}))
