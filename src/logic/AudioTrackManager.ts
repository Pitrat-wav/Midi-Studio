import * as Tone from 'tone'
import { ArrangementClip, useArrangementStore } from '../store/arrangementStore'
import { useAudioStore } from '../store/audioStore'
import { indexedDbManager } from './IndexedDbManager'

export class AudioTrackManager {
    private static instance: AudioTrackManager
    private playerCache: Map<string, Tone.GrainPlayer | Tone.Player> = new Map()

    private constructor() { }

    static getInstance() {
        if (!AudioTrackManager.instance) {
            AudioTrackManager.instance = new AudioTrackManager()
        }
        return AudioTrackManager.instance
    }

    /**
     * Creates or updates a player for a specific clip.
     * Restores from IndexedDB if the transient bufferUrl is invalid.
     */
    async createPlayer(clip: ArrangementClip): Promise<Tone.GrainPlayer | Tone.Player | null> {
        if (clip.type !== 'audio' || !clip.audioData) return null

        const { audioPlayers, addAudioPlayer } = useAudioStore.getState()
        const bpm = useAudioStore.getState().bpm

        // RESTORATION LOGIC: Check if URL is still valid, else fetch from IDB
        let url = clip.audioData.bufferUrl
        if (clip.audioData.blobId) {
            try {
                // Quick check if URL works (blobs URLs expire on reload)
                const response = await fetch(url, { method: 'HEAD' })
                if (!response.ok) throw new Error('Blob URL expired')
            } catch (e) {
                console.log(`♻️ Restoring audio clip ${clip.id} from IndexedDB...`)
                const blob = await indexedDbManager.getBlob(clip.audioData.blobId)
                if (blob) {
                    url = URL.createObjectURL(blob)
                    // Sync back to store so other components (waveform) use the new URL
                    useArrangementStore.getState().updateClip(clip.id, {
                        audioData: { ...clip.audioData, bufferUrl: url }
                    })
                }
            }
        }

        // Dispose existing if needed
        if (this.playerCache.has(clip.id)) {
            const old = this.playerCache.get(clip.id)
            old?.dispose()
        }

        let player: Tone.GrainPlayer | Tone.Player

        if (clip.audioData.warpMode === 'Stretch') {
            player = new Tone.GrainPlayer(clip.audioData.bufferUrl)
            player.overlap = 0.1
            player.grainSize = 0.08
        } else {
            player = new Tone.Player(clip.audioData.bufferUrl)
        }

        // AUTO-CROSSFADES (Audio Hygiene)
         (player as any).fadeIn = 0.01
            ; (player as any).fadeOut = 0.01

        // Wait for buffer to load
        await Tone.loaded()

        // Configure playback rate based on warp
        this.updatePlaybackRate(player, clip, bpm)

        player.toDestination()
        this.playerCache.set(clip.id, player)
        addAudioPlayer(clip.id, player)

        return player
    }

    /**
     * Updates playback rate for a player based on project BPM
     */
    updatePlaybackRate(player: Tone.GrainPlayer | Tone.Player, clip: ArrangementClip, currentBpm: number) {
        if (!clip.audioData || clip.audioData.warpMode === 'None') {
            player.playbackRate = 1
            return
        }

        const originalBpm = clip.audioData.originalBpm || 120
        const rate = currentBpm / originalBpm
        player.playbackRate = rate
    }

    /**
     * Global BPM update - call this when project BPM changes
     */
    onBpmChange(newBpm: number, clips: ArrangementClip[]) {
        clips.forEach(clip => {
            const player = this.playerCache.get(clip.id)
            if (player && clip.type === 'audio') {
                this.updatePlaybackRate(player, clip, newBpm)
            }
        })
    }

    /**
     * Cleanup resources
     */
    disposePlayer(clipId: string) {
        const player = this.playerCache.get(clipId)
        if (player) {
            player.dispose()
            this.playerCache.delete(clipId)
            useAudioStore.getState().removeAudioPlayer(clipId)
        }
    }
}

export const audioTrackManager = AudioTrackManager.getInstance()
