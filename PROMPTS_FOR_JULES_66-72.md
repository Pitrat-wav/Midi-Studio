# 🔧 PROMPTS FOR JULES — Midi-Studio 3D Knob Fixes
## Категория 6: CameraController (Промты 66-72)

---

## 📋 PROMPT 66: Исправить activeParam блокировку

**Файл:** `src/components/WebGL/CameraController.tsx`

**Проблема:**
CameraController блокируется при activeParam (line 102-103) но крутилки не устанавливают activeParam корректно.

**Текущий код:**
```tsx
// Block if using UI knobs (activeParam)
if (activeParam) return
```

**Решение:**
Убедиться что activeParam устанавливается при взаимодействии с крутилками:

```tsx
// В Knob3D.tsx или GenerativeKnob3D.tsx
const setInteraction = useVisualStore(s => s.setInteraction)

const handlePointerDown = () => {
    setInteraction(label, 1.0)  // Установить activeParam
    // ...
}

const handlePointerUp = () => {
    setInteraction(null, 0)  // Сбросить activeParam
    // ...
}
```

---

## 📋 PROMPT 67: Добавить smooth transition

**Файл:** `src/components/WebGL/CameraController.tsx`

**Текущий код (line 43-53):**
```tsx
useEffect(() => {
    if (focusInstrument === lastFocus.current) return
    lastFocus.current = focusInstrument

    let preset = OVERVIEW_CAMERA_PRESET
    if (focusInstrument && SPATIAL_LAYOUT[focusInstrument]) {
        preset = SPATIAL_LAYOUT[focusInstrument].cameraPreset
    }

    targetPos.current.set(...preset.position)
    targetLook.current.set(...preset.lookAt)
    isTransitioning.current = true

}, [focusInstrument])
```

**Решение:**
Добавить плавный transition с customizable duration:

```tsx
useEffect(() => {
    if (focusInstrument === lastFocus.current) return
    lastFocus.current = focusInstrument

    let preset = OVERVIEW_CAMERA_PRESET
    if (focusInstrument && SPATIAL_LAYOUT[focusInstrument]) {
        preset = SPATIAL_LAYOUT[focusInstrument].cameraPreset
    }

    targetPos.current.set(...preset.position)
    targetLook.current.set(...preset.lookAt)
    isTransitioning.current = true

    // Haptic feedback при смене инструмента
    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium')
    }

}, [focusInstrument])

// В useFrame
useFrame((state, delta) => {
    if (!controlsRef.current) return

    if (isTransitioning.current) {
        const lerp = 3 * delta  // Slower lerp для плавности
        camera.position.lerp(targetPos.current, lerp)
        controlsRef.current.target.lerp(targetLook.current, lerp)

        if (camera.position.distanceTo(targetPos.current) < 0.1 &&
            controlsRef.current.target.distanceTo(targetLook.current) < 0.1) {
            isTransitioning.current = false
        }
        controlsRef.current.update()
    }
    
    // ... rest of logic
})
```

---

## 📋 PROMPT 68: Исправить OrbitControls damping

**Файл:** `src/components/WebGL/CameraController.tsx`

**Текущий код (line 177-185):**
```tsx
return (
    <OrbitControls
        ref={controlsRef}
        enabled={gestures.activeGesture !== 'drag' && gestures.activeGesture !== 'two-swipe' && !activeParam}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={200}
        maxPolarAngle={Math.PI * 0.95}
        minPolarAngle={Math.PI * 0.05}
    />
)
```

**Решение:**
Уменьшить dampingFactor для более responsive controls:

```tsx
<OrbitControls
    ref={controlsRef}
    enabled={gestures.activeGesture !== 'drag' && gestures.activeGesture !== 'two-swipe' && !activeParam}
    enableDamping={true}
    dampingFactor={0.02}  // Уменьшить с 0.05 до 0.02
    minDistance={2}  // Увеличить min distance
    maxDistance={100}  // Уменьшить max distance
    maxPolarAngle={Math.PI * 0.9}
    minPolarAngle={Math.PI * 0.1}
    enableZoom={true}
    zoomSpeed={0.5}
    rotateSpeed={0.5}
/>
```

---

## 📋 PROMPT 69: Добавить gamepad support

**Файл:** `src/components/WebGL/CameraController.tsx`

**Решение:**
Gamepad support уже реализован (line 107-165), убедиться что работает корректно:

```tsx
// 1. Gamepad Input
const leftStick = GamepadManager.getStick('left')
const rightStick = GamepadManager.getStick('right')

// Deadzone check
const gpMove = Math.abs(leftStick.y) > 0.1 || Math.abs(leftStick.x) > 0.1
const gpRot = Math.abs(rightStick.x) > 0.1

// В useFrame
if (gpMove) {
    // Left Stick Y -> Forward/Back (Inverted typically, stick up is -1)
    camera.position.addScaledVector(forward, -leftStick.y * speed)
    controlsRef.current.target.addScaledVector(forward, -leftStick.y * speed)

    // Left Stick X -> Strafe
    camera.position.addScaledVector(right, leftStick.x * speed)
    controlsRef.current.target.addScaledVector(right, leftStick.x * speed)
}
if (gpRot) {
    // Right Stick X -> Rotate
    (controlsRef.current as any).rotateLeft?.(-rightStick.x * rotSpeed)
}
```

---

## 📋 PROMPT 70: Исправить min/max distance

**Файл:** `src/components/WebGL/CameraController.tsx`

**Решение:**
Настроить distance limits:

```tsx
<OrbitControls
    ref={controlsRef}
    minDistance={3}  // Не ближе 3 единиц
    maxDistance={50}  // Не дальше 50 единиц
    // ...
/>
```

---

## 📋 PROMPT 71: Добавить keyboard navigation

**Файл:** `src/components/WebGL/CameraController.tsx`

**Решение:**
Keyboard navigation уже реализован (line 55-80), убедиться что работает корректно:

```tsx
useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
        keys.current.add(e.code)

        // Ignore if typing in an input
        if (e.target instanceof HTMLInputElement) return

        // Instrument Shortcuts
        switch (e.key) {
            case '0': setFocus(null); break;
            case '1': setFocus('drums'); break;
            case '2': setFocus('bass'); break;
            case '3': setFocus('harmony'); break;
            case '4': setFocus('pads'); break;
            case '5': setFocus('sequencer'); break;
            case '6': setFocus('drone'); break;
            case '7': setFocus('master'); break;
            case '8': setFocus('sampler'); break;
            case '9': setFocus('buchla'); break;
        }
    }
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.code)

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
        window.removeEventListener('keydown', onDown)
        window.removeEventListener('keyup', onUp)
    }
}, [setFocus])
```

---

## 📋 PROMPT 72: Исправить focus preset

**Файл:** `src/lib/SpatialLayout.ts`

**Решение:**
Убедиться что camera presets правильные для всех инструментов:

```tsx
export const SPATIAL_LAYOUT: Record<InstrumentType, InstrumentLayout> = {
    drums: {
        position: [0, 0, 0],
        cameraPreset: { position: [0, 8, 12], lookAt: [0, 0, 0], fov: 60 },
        // ...
    },
    bass: {
        position: [-25, 0, 0],
        cameraPreset: { position: [-25, 6, 10], lookAt: [-25, 0, 0], fov: 60 },
        // ...
    },
    // ... убедиться что все presets имеют правильные позиции
}
```

---

**END OF CATEGORY 6 (Prompts 66-72)**
