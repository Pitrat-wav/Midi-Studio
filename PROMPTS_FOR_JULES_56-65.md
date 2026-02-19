# 🔧 PROMPTS FOR JULES — Midi-Studio 3D Knob Fixes
## Категория 5: GestureManager интеграция (Промты 56-65)

---

## 📋 PROMPT 56: Исправить activeGesture detection

**Файл:** `src/logic/GestureManager.ts`

**Проблема:**
activeGesture не всегда правильно определяется при drag.

**Текущий код (line 140-155):**
```tsx
if (state.pointerCount === 1) {
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
```

**Решение:**
Улучшить detection для 3D крутилок:

```tsx
if (state.pointerCount === 1) {
    const deltaX = x - state.startPos.x
    const deltaY = y - state.startPos.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (state.activeGesture === 'none' && distance > 20) {
        if (state.isEdgeSwipe) {
            updates.activeGesture = 'swipe'
        } else if (state.targetPosition) {
            // Проверить если targetPosition это 3D контрол
            updates.activeGesture = 'drag'
            
            // Установить initial position для drag
            updates.startPos = { x: state.startPos.x, y: state.startPos.y }
        } else {
            updates.activeGesture = 'swipe'
        }
    }
}
```

---

## 📋 PROMPT 57: Добавить targetPosition update

**Файл:** `src/logic/GestureManager.ts`

**Проблема:**
targetPosition не обновляется при drag.

**Решение:**
Добавить обновление currentPos:

```tsx
onMove: (x, y, pointerId = 0) => {
    const state = get()
    if (!state.pointers[pointerId]) return

    const newPointers = { ...state.pointers }
    newPointers[pointerId] = { ...newPointers[pointerId], currentX: x, currentY: y }

    const updates: Partial<GestureState> = { 
        pointers: newPointers, 
        currentPos: { x, y }  // Обновить currentPos
    }

    // ... rest of logic
}
```

---

## 📋 PROMPT 58: Исправить pointerCount логику

**Файл:** `src/logic/GestureManager.ts`

**Проблема:**
pointerCount может быть неправильным при быстром tap.

**Решение:**
Убедиться что pointerCount обновляется корректно:

```tsx
onStart: (x, y, worldPos, pointerId = 0) => {
    const state = get()
    const newPointers = { ...state.pointers }
    newPointers[pointerId] = { startX: x, startY: y, currentX: x, currentY: y }
    const newCount = Object.keys(newPointers).length

    const updates: Partial<GestureState> = {
        pointers: newPointers,
        pointerCount: newCount,  // Явно установить count
        currentPos: { x, y }
    }

    // ... rest of logic
}
```

---

## 📋 PROMPT 59: Добавить edge swipe detection

**Файл:** `src/logic/GestureManager.ts`

**Решение:**
Edge swipe уже реализован (line 66-72), убедиться что работает корректно:

```tsx
const threshold = 60
let side: any = 'none'
if (x < threshold) side = 'left'
else if (x > window.innerWidth - threshold) side = 'right'
else if (y < threshold) side = 'top'
else if (y > window.innerHeight - threshold) side = 'bottom'

const updates: Partial<GestureState> = {
    // ...
    isEdgeSwipe: side !== 'none',
    edgeSide: side
}
```

---

## 📋 PROMPT 60: Исправить long-press timer

**Файл:** `src/logic/GestureManager.ts`

**Текущий код (line 83-95):**
```tsx
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
```

**Проблема:**
600ms может быть слишком долго.

**Решение:**
Уменьшить до 400ms:

```tsx
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
}, 400)  // Уменьшить с 600 до 400
```

---

## 📋 PROMPT 61: Добавить two-swipe navigation

**Файл:** `src/logic/GestureManager.ts`

**Решение:**
Two-swipe уже реализован (line 117-135), убедиться что работает корректно:

```tsx
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
}
```

---

## 📋 PROMPT 62: Исправить reset логику

**Файл:** `src/logic/GestureManager.ts`

**Текущий код (line 160-185):**
```tsx
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
```

**Решение:**
Убедиться что reset вызывается после каждого gesture:

```tsx
onEnd: (pointerId = 0) => {
    const state = get()
    const newPointers = { ...state.pointers }
    if (newPointers[pointerId]) {
        delete newPointers[pointerId]
    }
    const newCount = Object.keys(newPointers).length

    let nextGesture = state.activeGesture

    if (newCount === 0) {
        // Reset после завершения всех pointers
        setTimeout(() => {
            if (nextGesture !== 'hold') {
                set({
                    activeGesture: 'none',
                    startTime: 0,
                    targetPosition: null,
                    isEdgeSwipe: false,
                    edgeSide: 'none',
                    pointers: {},
                    pointerCount: 0
                })
            } else {
                set({ pointers: {}, pointerCount: 0 })
            }
        }, 100)  // Небольшая задержка для завершения анимаций
    } else {
        set({ pointers: newPointers, pointerCount: newCount, activeGesture: nextGesture })
    }
}
```

---

## 📋 PROMPT 63: Добавить haptic feedback

**Файл:** `src/logic/GestureManager.ts`

**Решение:**
Добавить haptic feedback для всех gesture событий:

```tsx
// В onStart
if (newCount === 1) {
    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light')
    }
}

// В onMove при detect drag
if (updates.activeGesture === 'drag') {
    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.selectionChanged()
    }
}

// В onEnd
if (nextGesture === 'tap') {
    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light')
    }
}
```

---

## 📋 PROMPT 64: Исправить isEdgeSwipe flag

**Файл:** `src/logic/GestureManager.ts`

**Решение:**
Убедиться что isEdgeSwipe сбрасывается корректно:

```tsx
onEnd: (pointerId = 0) => {
    // ...
    if (newCount === 0) {
        set({
            // ...
            isEdgeSwipe: false,  // Явно сбросить
            edgeSide: 'none',
            // ...
        })
    }
}
```

---

## 📋 PROMPT 65: Добавить radial menu items

**Файл:** `src/components/WebGL/WebGLScene.tsx`

**Решение:**
Добавить контекстные действия для крутилок:

```tsx
<RadialMenu3D
    visible={gestures.isRadialMenuOpen}
    position={radialPos}
    items={[
        { id: 'focus', label: 'FOCUS', color: '#3390ec' },
        { id: 'overview', label: 'OVERVIEW', color: '#ffffff' },
        { id: 'presets', label: 'PRESETS', color: '#ffcc33' },
        { id: 'panic', label: 'PANIC', color: '#ff3b30' },
        { id: 'reset', label: 'RESET KNOB', color: '#00ff00' },  // Новый item
        { id: 'fine', label: 'FINE TUNE', color: '#00ffff' }  // Новый item
    ]}
    onSelect={(id) => {
        if (id === 'reset' && gestures.targetPosition) {
            // Reset knob to default
            // ... implementation
        } else if (id === 'fine' && gestures.targetPosition) {
            // Enable fine tune mode
            // ... implementation
        }
        // ... rest of logic
    }}
/>
```

---

**END OF CATEGORY 5 (Prompts 56-65)**
