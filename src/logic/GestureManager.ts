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

export type GestureType = 'none' | 'swipe' | 'drag' | 'hold' | 'tap' | 'two-swipe'

interface PointerData {
    startX: number
    startY: number
    currentX: number
    currentY: number
}

interface GestureState {
    activeGesture: GestureType
    isEdgeSwipe: boolean
    edgeSide: 'left' | 'right' | 'top' | 'bottom' | 'none'
    startPos: { x: number; y: number }
    currentPos: { x: number; y: number }
    startTime: number
    isRadialMenuOpen: boolean
    targetPosition: THREE.Vector3 | null

    // Multi-touch support
    pointers: Record<number, PointerData>
    pointerCount: number

    // Actions
    onStart: (x: number, y: number, worldPos?: THREE.Vector3, pointerId?: number) => void
    onMove: (x: number, y: number, pointerId?: number) => void
    onEnd: (pointerId?: number) => void
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

    pointers: {},
    pointerCount: 0,

    onStart: (x, y, worldPos, pointerId = 0) => {
        const state = get()
        const newPointers = { ...state.pointers }
        newPointers[pointerId] = { startX: x, startY: y, currentX: x, currentY: y }
        const newCount = Object.keys(newPointers).length

        const threshold = 60
        let side: any = 'none'
        if (x < threshold) side = 'left'
        else if (x > window.innerWidth - threshold) side = 'right'
        else if (y < threshold) side = 'top'
        else if (y > window.innerHeight - threshold) side = 'bottom'

        const updates: Partial<GestureState> = {
            pointers: newPointers,
            pointerCount: newCount,
            currentPos: { x, y }
        }

        // If first pointer, initialize gesture tracking
        if (newCount === 1) {
            updates.startPos = { x, y }
            updates.startTime = Date.now()
            updates.activeGesture = 'none'
            updates.isEdgeSwipe = side !== 'none'
            updates.edgeSide = side
            updates.targetPosition = worldPos || null
        }

        set(updates)

        // Start long-press timer (only for single touch)
        if (newCount === 1) {
            setTimeout(() => {
                const state = get()
                const deltaX = Math.abs(state.currentPos.x - state.startPos.x)
                const deltaY = Math.abs(state.currentPos.y - state.startPos.y)

                if (state.startTime !== 0 && state.pointerCount === 1 && deltaX < 10 && deltaY < 10 && state.activeGesture === 'none') {
                    set({ activeGesture: 'hold', isRadialMenuOpen: true })
                    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
                        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium')
                    }
                }
            }, 600)
        }
    },

    onMove: (x, y, pointerId = 0) => {
        const state = get()
        if (!state.pointers[pointerId]) return

        const newPointers = { ...state.pointers }
        newPointers[pointerId] = { ...newPointers[pointerId], currentX: x, currentY: y }

        const updates: Partial<GestureState> = { pointers: newPointers, currentPos: { x, y } }

        if (state.pointerCount === 2) {
            // Detect Two-Swipe
            const pts = Object.values(newPointers)
            const p1 = pts[0]
            const p2 = pts[1]

            const d1x = p1.currentX - p1.startX
            const d1y = p1.currentY - p1.startY
            const d2x = p2.currentX - p2.startX
            const d2y = p2.currentY - p2.startY

            const dist1 = Math.sqrt(d1x * d1x + d1y * d1y)
            const dist2 = Math.sqrt(d2x * d2x + d2y * d2y)

            if (dist1 > 50 && dist2 > 50) {
                // Check if moving in same direction
                const dot = (d1x * d2x + d1y * d2y) / (dist1 * dist2)
                if (dot > 0.8) {
                    updates.activeGesture = 'two-swipe'
                }
            }
        } else if (state.pointerCount === 1) {
            const deltaX = x - state.startPos.x
            const deltaY = y - state.startPos.y
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

            if (state.activeGesture === 'none' && distance > 20) {
                if (state.isEdgeSwipe) {
                    updates.activeGesture = 'swipe'
                } else if (state.targetPosition) {
                    updates.activeGesture = 'drag'
                } else {
                    updates.activeGesture = 'swipe'
                }
            }
        }

        set(updates)
    },

    onEnd: (pointerId = 0) => {
        const state = get()
        const newPointers = { ...state.pointers }
        if (newPointers[pointerId]) {
            delete newPointers[pointerId]
        }
        const newCount = Object.keys(newPointers).length

        const duration = Date.now() - state.startTime
        let nextGesture = state.activeGesture

        if (state.activeGesture === 'none' && state.pointerCount === 1 && duration < 200) {
            nextGesture = 'tap'
        }

        if (newCount === 0) {
            if (nextGesture !== 'hold') {
                set({
                    startTime: 0,
                    targetPosition: null,
                    isEdgeSwipe: false,
                    edgeSide: 'none',
                    activeGesture: nextGesture,
                    pointers: {},
                    pointerCount: 0
                })
            } else {
                set({ pointers: {}, pointerCount: 0 })
            }
        } else {
            set({ pointers: newPointers, pointerCount: newCount, activeGesture: nextGesture })
        }
    },

    reset: () => set({
        activeGesture: 'none',
        startTime: 0,
        isRadialMenuOpen: false,
        targetPosition: null,
        isEdgeSwipe: false,
        edgeSide: 'none',
        pointers: {},
        pointerCount: 0
    })
}))
