import { test } from 'node:test'
import assert from 'node:assert'

// Mock window
(global as any).window = {
    innerWidth: 1024,
    innerHeight: 768,
    Telegram: {
        WebApp: {
            HapticFeedback: {
                impactOccurred: () => { },
                selectionChanged: () => { }
            }
        }
    }
}

import { useGestureStore } from './GestureManager.ts'

test('GestureManager - Single touch tap', () => {
    const gestures = useGestureStore.getState()
    gestures.reset()

    // Simulate tap
    gestures.onStart(100, 100, undefined, 1)
    gestures.onEnd(1)

    const state = useGestureStore.getState()
    assert.strictEqual(state.activeGesture, 'tap')
})

test('GestureManager - Single touch swipe', () => {
    const gestures = useGestureStore.getState()
    gestures.reset()

    // Simulate swipe
    gestures.onStart(100, 100, undefined, 1)
    gestures.onMove(200, 100, 1)

    const state = useGestureStore.getState()
    assert.strictEqual(state.activeGesture, 'swipe')

    gestures.onEnd(1)
})

test('GestureManager - Two-Swipe detection', () => {
    const gestures = useGestureStore.getState()
    gestures.reset()

    // Simulate two fingers down
    gestures.onStart(100, 100, undefined, 1)
    gestures.onStart(120, 100, undefined, 2)

    // Move both fingers (> 50px)
    gestures.onMove(160, 100, 1)
    gestures.onMove(180, 100, 2)

    const state = useGestureStore.getState()
    assert.strictEqual(state.activeGesture, 'two-swipe')

    gestures.onEnd(1)
    gestures.onEnd(2)
    assert.strictEqual(useGestureStore.getState().pointerCount, 0)
})

test('GestureManager - Two-Swipe direction', () => {
    const gestures = useGestureStore.getState()
    gestures.reset()

    // Simulate two fingers swiping RIGHT (> 50px)
    gestures.onStart(100, 100, undefined, 1)
    gestures.onStart(100, 150, undefined, 2)
    gestures.onMove(200, 100, 1)
    gestures.onMove(200, 150, 2)

    const state = useGestureStore.getState()
    assert.strictEqual(state.activeGesture, 'two-swipe')

    const pts = Object.values(state.pointers)
    const dx = (pts[0].currentX - pts[0].startX + pts[1].currentX - pts[1].startX) / 2
    assert.ok(dx > 50)
})
