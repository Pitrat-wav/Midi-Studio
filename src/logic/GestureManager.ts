/**
 * GestureManager — Detects 3D Intent
 * 
 * Objectives:
 * 1. Distinguish between Camera Swipe and Parameter Drag.
 * 2. Detect Long-Press for Radial Menu activation.
 * 3. Handle "Two-Swipe" navigation logic.
 */

import { create } from 'zustand'
import * as THREE from 'three'

export type GestureType = 'none' | 'swipe' | 'drag' | 'hold' | 'tap'

interface GestureState {
    activeGesture: GestureType
    isEdgeSwipe: boolean
    edgeSide: 'left' | 'right' | 'top' | 'bottom' | 'none'
    startPos: { x: number; y: number }
    currentPos: { x: number; y: number }
    startTime: number
    isRadialMenuOpen: boolean
    targetPosition: THREE.Vector3 | null

    // Actions
    onStart: (x: number, y: number, worldPos?: THREE.Vector3) => void
    onMove: (x: number, y: number) => void
    onEnd: () => void
    reset: () => void
}

export const useGestureStore = create<GestureState>((set, get) => ({
    activeGesture: 'none',
    isEdgeSwipe: false,
    edgeSide: 'none',
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    startTime: 0,
    isRadialMenuOpen: false,
    targetPosition: null,

    onStart: (x, y, worldPos) => {
        const threshold = 60
        let side: any = 'none'
        if (x < threshold) side = 'left'
        else if (x > window.innerWidth - threshold) side = 'right'
        else if (y < threshold) side = 'top'
        else if (y > window.innerHeight - threshold) side = 'bottom'

        set({
            startPos: { x, y },
            currentPos: { x, y },
            startTime: Date.now(),
            activeGesture: 'none',
            isEdgeSwipe: side !== 'none',
            edgeSide: side,
            targetPosition: worldPos || null
        })

        // Start long-press timer
        setTimeout(() => {
            const state = get()
            const deltaX = Math.abs(state.currentPos.x - state.startPos.x)
            const deltaY = Math.abs(state.currentPos.y - state.startPos.y)

            if (state.startTime !== 0 && deltaX < 10 && deltaY < 10 && state.activeGesture === 'none') {
                set({ activeGesture: 'hold', isRadialMenuOpen: true })
                if ((window as any).Telegram?.WebApp?.HapticFeedback) {
                    (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium')
                }
            }
        }, 600)
    },

    onMove: (x, y) => {
        const state = get()
        const deltaX = x - state.startPos.x
        const deltaY = y - state.startPos.y
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

        set({ currentPos: { x, y } })

        if (state.activeGesture === 'none' && distance > 20) {
            if (state.isEdgeSwipe) {
                set({ activeGesture: 'swipe' })
            } else if (state.targetPosition) {
                set({ activeGesture: 'drag' })
            } else {
                set({ activeGesture: 'swipe' })
            }
        }
    },

    onEnd: () => {
        const state = get()
        const duration = Date.now() - state.startTime

        if (state.activeGesture === 'none' && duration < 200) {
            set({ activeGesture: 'tap' })
        }

        if (state.activeGesture !== 'hold') {
            set({ startTime: 0, targetPosition: null, isEdgeSwipe: false, edgeSide: 'none' })
        }
    },

    reset: () => set({
        activeGesture: 'none',
        startTime: 0,
        isRadialMenuOpen: false,
        targetPosition: null,
        isEdgeSwipe: false,
        edgeSide: 'none'
    })
}))
