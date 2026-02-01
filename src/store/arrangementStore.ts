import { create } from 'zustand'

export interface AutomationPoint {
    tick: number
    value: number
}

export interface SongMarker {
    id: string
    tick: number
    label: string
    color?: string
}

export interface ArrangementClip {
    id: string
    trackId: string
    snapshotId: number // ID from SNAPSHOT_LIBRARY
    startTick: number  // Start position in 16th notes
    durationTicks: number // Length in 16th notes
    name?: string
    color?: string
    gain?: number
}

interface TrackSettings {
    mute: boolean
    solo: boolean
    volume: number
    showAutomation: boolean
    automationParam: 'volume' | 'filter' | 'cutoff'
}

interface ArrangementState {
    clips: ArrangementClip[]
    markers: SongMarker[]
    automations: Record<string, Record<string, AutomationPoint[]>> // trackId -> param -> values
    totalLengthTicks: number

    // Pro Features
    loopStart: number
    loopEnd: number
    isLooping: boolean
    snapResolution: '1n' | '4n' | '8n' | '16n' | '4t' | '8t'
    zoomLevel: number // TPP (Ticks per pixel)

    // Track Mixer
    tracks: Record<string, TrackSettings>

    // Selection State
    selectedClipIds: string[]

    // Actions
    addClip: (clip: Omit<ArrangementClip, 'id'>) => void
    removeClip: (id: string) => void
    updateClip: (id: string, updates: Partial<ArrangementClip>) => void
    splitClip: (id: string, tick: number) => void

    setSelectedClips: (ids: string[]) => void
    moveSelectedClips: (deltaTicks: number, deltaTrack?: number) => void
    deleteSelectedClips: () => void
    duplicateSelectedClips: () => void

    setLoopPoints: (start: number, end: number) => void
    setLooping: (active: boolean) => void
    setTrackSetting: (trackId: string, settings: Partial<TrackSettings>) => void
    setZoom: (zoom: number) => void

    // Markers & Automation
    addMarker: (tick: number, label: string) => void
    removeMarker: (id: string) => void
    setAutomationPoint: (trackId: string, param: string, tick: number, value: number) => void
    removeAutomationPoint: (trackId: string, param: string, tick: number) => void

    clearArrangement: () => void
}

const TRACK_ORDER = ['drums', 'bass', 'lead', 'pads', 'sampler', 'harm']

export const useArrangementStore = create<ArrangementState>((set) => ({
    clips: [
        { id: '1', trackId: 'drums', snapshotId: 0, startTick: 0, durationTicks: 32 },
        { id: '2', trackId: 'bass', snapshotId: 0, startTick: 0, durationTicks: 32 },
        { id: '3', trackId: 'drums', snapshotId: 1, startTick: 32, durationTicks: 32 },
    ],
    markers: [
        { id: 'm1', tick: 0, label: 'INTRO', color: '#00ffaa' },
        { id: 'm2', tick: 64, label: 'DROP', color: '#ff3300' }
    ],
    automations: {},
    totalLengthTicks: 512, // 32 bars

    loopStart: 0,
    loopEnd: 64,
    isLooping: false,
    snapResolution: '4n',
    zoomLevel: 4,
    selectedClipIds: [],

    tracks: {
        drums: { mute: false, solo: false, volume: 0.8, showAutomation: false, automationParam: 'volume' },
        bass: { mute: false, solo: false, volume: 0.8, showAutomation: false, automationParam: 'volume' },
        lead: { mute: false, solo: false, volume: 0.8, showAutomation: false, automationParam: 'volume' },
        pads: { mute: false, solo: false, volume: 0.8, showAutomation: false, automationParam: 'volume' },
        sampler: { mute: false, solo: false, volume: 0.8, showAutomation: false, automationParam: 'volume' },
        harm: { mute: false, solo: false, volume: 0.8, showAutomation: false, automationParam: 'volume' }
    },

    addClip: (clip) => set((state) => ({
        clips: [...state.clips, { ...clip, id: Math.random().toString(36).substring(2, 9) }]
    })),

    removeClip: (id) => set((state) => ({
        clips: state.clips.filter(c => c.id !== id)
    })),

    updateClip: (id, updates) => set((state) => ({
        clips: state.clips.map(c => c.id === id ? { ...c, ...updates } : c)
    })),

    splitClip: (id, tick) => set((state) => {
        const clip = state.clips.find(c => c.id === id)
        if (!clip || tick <= clip.startTick || tick >= clip.startTick + clip.durationTicks) return state

        const firstHalf = { ...clip, durationTicks: tick - clip.startTick }
        const secondHalf = {
            ...clip,
            id: Math.random().toString(36).substring(2, 9),
            startTick: tick,
            durationTicks: clip.startTick + clip.durationTicks - tick
        }

        return {
            clips: state.clips.map(c => c.id === id ? firstHalf : c).concat(secondHalf)
        }
    }),

    setSelectedClips: (ids) => set({ selectedClipIds: ids }),

    moveSelectedClips: (deltaTicks, deltaTrack = 0) => set((state) => ({
        clips: state.clips.map(c => {
            if (state.selectedClipIds.includes(c.id)) {
                let trackId = c.trackId
                if (deltaTrack !== 0) {
                    const currentIdx = TRACK_ORDER.indexOf(c.trackId)
                    const nextIdx = Math.max(0, Math.min(TRACK_ORDER.length - 1, currentIdx + deltaTrack))
                    trackId = TRACK_ORDER[nextIdx]
                }
                return { ...c, startTick: Math.max(0, c.startTick + deltaTicks), trackId }
            }
            return c
        })
    })),

    deleteSelectedClips: () => set((state) => ({
        clips: state.clips.filter(c => !state.selectedClipIds.includes(c.id)),
        selectedClipIds: []
    })),

    duplicateSelectedClips: () => set((state) => {
        const selectedClips = state.clips.filter(c => state.selectedClipIds.includes(c.id))
        const newClips = selectedClips.map(c => ({
            ...c,
            id: Math.random().toString(36).substring(2, 9),
            startTick: c.startTick + c.durationTicks
        }))
        return {
            clips: [...state.clips, ...newClips],
            selectedClipIds: newClips.map(nc => nc.id)
        }
    }),

    setLoopPoints: (start, end) => set({ loopStart: start, loopEnd: end }),
    setLooping: (active) => set({ isLooping: active }),

    setTrackSetting: (trackId, settings) => set((state) => ({
        tracks: {
            ...state.tracks,
            [trackId]: { ...state.tracks[trackId], ...settings }
        }
    })),

    setZoom: (zoom) => set({ zoomLevel: zoom }),

    addMarker: (tick, label) => set((state) => ({
        markers: [...state.markers, { id: Math.random().toString(36).substring(2, 9), tick, label }]
    })),

    removeMarker: (id) => set((state) => ({
        markers: state.markers.filter(m => m.id !== id)
    })),

    setAutomationPoint: (trackId, param, tick, value) => set((state) => {
        const trackAuto = state.automations[trackId] || {}
        const paramPoints = trackAuto[param] || []

        // Replace if exists at same tick, or insert
        const existingIdx = paramPoints.findIndex(p => p.tick === tick)
        const newPoints = [...paramPoints]
        if (existingIdx >= 0) {
            newPoints[existingIdx] = { tick, value }
        } else {
            newPoints.push({ tick, value })
            newPoints.sort((a, b) => a.tick - b.tick)
        }

        return {
            automations: {
                ...state.automations,
                [trackId]: { ...trackAuto, [param]: newPoints }
            }
        }
    }),

    removeAutomationPoint: (trackId, param, tick) => set((state) => {
        const trackAuto = state.automations[trackId] || {}
        const paramPoints = trackAuto[param] || []
        return {
            automations: {
                ...state.automations,
                [trackId]: { ...trackAuto, [param]: paramPoints.filter(p => p.tick !== tick) }
            }
        }
    }),

    clearArrangement: () => set({ clips: [], markers: [], automations: {} })
}))
