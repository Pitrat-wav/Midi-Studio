# 🔧 PROMPTS FOR JULES — Midi-Studio 3D Knob Fixes
## Категория 3: GenerativeKnob3D (Промты 31-40)

---

## 📋 PROMPT 31: Исправить activeParam sync

**Файл:** `src/components/WebGL/GenerativeKnob3D.tsx`

**Проблема:**
Компонент использует `activeParam` из visualStore но не устанавливает его при взаимодействии.

**Текущий код (line 18-22):**
```tsx
const setInteraction = useVisualStore(s => s.setInteraction)
const activeParam = useVisualStore(s => s.activeParam)
const interactionEnergy = useVisualStore(s => s.interactionEnergy)

const isEditing = activeParam === label
```

**Решение:**
Убедиться что setInteraction вызывается с правильным label:

```tsx
onPointerDown={(e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (e.nativeEvent && e.nativeEvent.target) {
        (e.nativeEvent.target as HTMLElement).setPointerCapture(e.pointerId)
    }
    setInteraction(label, 1.0) // Устанавливаем label как activeParam
}}
```

---

## 📋 PROMPT 32: Добавить interactionEnergy decay

**Файл:** `src/components/WebGL/GenerativeKnob3D.tsx`, `src/store/visualStore.ts`

**Проблема:**
interactionEnergy не затухает плавно после отпускания крутилки.

**Решение в visualStore.ts:**
Добавить decay логику в useFrame:

```tsx
// В visualStore.ts decay функции
decay: () => {
    const state = get()
    if (state.interactionEnergy > 0) {
        set({
            interactionEnergy: Math.max(0, state.interactionEnergy - 0.05)
        })
    }
}
```

И вызвать decay в useFrame компонента:

```tsx
useFrame(() => {
    // Decay interaction energy
    if (interactionEnergy > 0.01) {
        setInteraction(label, Math.max(0, interactionEnergy - 0.02))
    }
})
```

---

## 📋 PROMPT 33: Исправить scale animation

**Файл:** `src/components/WebGL/GenerativeKnob3D.tsx`

**Текущий код (line 28-30):**
```tsx
useFrame(() => {
    if (meshRef.current) {
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotation, 0.1)
        const scale = 1 + (isEditing ? interactionEnergy * 0.2 : 0)
        meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1)
    }
})
```

**Проблема:**
lerp factor 0.1 может быть слишком медленным.

**Решение:**
```tsx
useFrame((state, delta) => {
    if (meshRef.current) {
        const lerpFactor = Math.min(0.2, delta * 15)
        meshRef.current.rotation.y = THREE.MathUtils.lerp(
            meshRef.current.rotation.y,
            targetRotation,
            lerpFactor
        )
        
        const targetScale = 1 + (isEditing ? interactionEnergy * 0.2 : 0)
        meshRef.current.scale.lerp(
            new THREE.Vector3(targetScale, targetScale, targetScale),
            lerpFactor
        )
    }
})
```

---

## 📋 PROMPT 34: Добавить color interpolation

**Файл:** `src/components/WebGL/GenerativeKnob3D.tsx`

**Решение:**
Интерполировать цвет от мин (синий) до макс (красный) значения:

```tsx
const normalizedValue = (value - min) / (max - min)

// Interpolate from cyan (#00ffff) to magenta (#ff00ff)
const color1 = new THREE.Color(0x00ffff)
const color2 = new THREE.Color(0xff00ff)
const interpolatedColor = color1.lerp(color2, normalizedValue)

// В useFrame или useMemo
const emissiveIntensity = isEditing ? 1 : 0.1

// В meshStandardMaterial
<meshStandardMaterial
    color={interpolatedColor}
    metalness={0.9}
    roughness={0.1}
    emissive={interpolatedColor}
    emissiveIntensity={emissiveIntensity}
/>
```

---

## 📋 PROMPT 35: Исправить onPointerMove логику

**Файл:** `src/components/WebGL/GenerativeKnob3D.tsx`

**Текущий код (line 52-59):**
```tsx
onPointerMove={(e: ThreeEvent<PointerEvent>) => {
    if (isEditing && e.buttons > 0) {
        // Use movementY from nativeEvent
        const delta = e.nativeEvent.movementY * -0.01
        const newValue = Math.min(max, Math.max(min, value + delta * (max - min)))
        onChange?.(newValue)
        setInteraction(label, 1.0)
    }
}}
```

**Проблема:**
Используется только movementY, не учитывается movementX для лучшего контроля.

**Решение:**
```tsx
onPointerMove={(e: ThreeEvent<PointerEvent>) => {
    if (isEditing && e.buttons > 0) {
        // Combine X and Y movement for better control
        const movementY = e.nativeEvent.movementY || 0
        const movementX = e.nativeEvent.movementX || 0
        
        // Use diagonal movement for more sensitivity
        const delta = (movementY - movementX) * -0.005
        const range = max - min
        const newValue = Math.min(max, Math.max(min, value + delta * range))
        
        if (newValue !== value) {
            onChange?.(newValue)
            setInteraction(label, 1.0)
            
            if ((window as any).Telegram?.WebApp?.HapticFeedback) {
                (window as any).Telegram.WebApp.HapticFeedback.selectionChanged()
            }
        }
    }
}}
```

---

## 📋 PROMPT 36: Добавить snap feedback

**Файл:** `src/components/WebGL/GenerativeKnob3D.tsx`

**Решение:**
Визуальный feedback при snap к значениям:

```tsx
const snapValues = [0, 0.25, 0.5, 0.75, 1] // Snap points
const nearestSnap = snapValues.reduce((prev, curr) =>
    Math.abs(curr - normalizedValue) < Math.abs(prev - normalizedValue) ? curr : prev
)
const isSnapped = Math.abs(nearestSnap - normalizedValue) < 0.05

// Визуальный feedback
{isSnapped && (
    <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color="#00ff00" />
    </mesh>
)}
```

---

## 📋 PROMPT 37: Исправить min/max bounds

**Файл:** `src/components/WebGL/GenerativeKnob3D.tsx`

**Проблема:**
Clamping может не работать корректно при быстром drag.

**Решение:**
Убедиться что clamping применяется правильно:

```tsx
onPointerMove={(e: ThreeEvent<PointerEvent>) => {
    if (isEditing && e.buttons > 0) {
        const movementY = e.nativeEvent.movementY || 0
        const delta = movementY * -0.005
        const range = max - min
        let newValue = value + delta * range
        
        // Строгий clamping
        newValue = THREE.MathUtils.clamp(newValue, min, max)
        
        if (newValue !== value) {
            onChange?.(newValue)
            setInteraction(label, 1.0)
        }
    }
}}
```

---

## 📋 PROMPT 38: Добавить MIDI CC mapping

**Файл:** `src/components/WebGL/GenerativeKnob3D.tsx`

**Решение:**
Связать крутилку с MIDI CC:

```tsx
import { useEffect } from 'react'
import { useAudioStore } from '../../store/audioStore'

export function GenerativeKnob3D({ label, onChange, ... }: GenerativeKnob3DProps) {
    const midiCcMap = useAudioStore(s => s.midiCcMap) // Предполагаемый store
    
    // Listen for MIDI CC messages
    useEffect(() => {
        const handleMidiMessage = (cc: number, value: number) => {
            // Найти если этот label соответствует MIDI CC
            const ccMapping = midiCcMap?.[label]
            if (ccMapping === cc) {
                // Конвертировать MIDI 0-127 в min-max
                const normalizedValue = value / 127
                const newValue = min + normalizedValue * (max - min)
                onChange(newValue)
            }
        }
        
        // Subscribe to MIDI events
        // ... implementation depends on MIDI system
        
        return () => {
            // Unsubscribe
        }
    }, [label, midiCcMap, min, max, onChange])
    
    // ... rest of component
}
```

---

## 📋 PROMPT 39: Исправить z-fighting

**Файл:** `src/components/WebGL/GenerativeKnob3D.tsx`

**Проблема:**
Halo Ring может z-fight с knob body.

**Текущий код (line 63-69):**
```tsx
{/* Halo Ring */}
<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
    <ringGeometry args={[0.4, 0.45, 64]} />
    <meshBasicMaterial
        color={color}
        transparent
        opacity={isEditing ? 0.8 : 0.2}
    />
</mesh>
```

**Решение:**
Изменить позицию для предотвращения z-fighting:

```tsx
{/* Halo Ring - смещен ниже чтобы избежать z-fighting */}
<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
    <ringGeometry args={[0.4, 0.45, 64]} />
    <meshBasicMaterial
        color={color}
        transparent
        opacity={isEditing ? 0.8 : 0.2}
        depthWrite={false} // Предотвратить z-fighting
        blending={THREE.AdditiveBlending}
    />
</mesh>
```

---

## 📋 PROMPT 40: Добавить audio reactive pulse

**Файл:** `src/components/WebGL/GenerativeKnob3D.tsx`

**Решение:**
Добавить пульсацию от audio:

```tsx
import { useAudioVisualBridge } from '../../lib/AudioVisualBridge'

export function GenerativeKnob3D({ ... }: GenerativeKnob3DProps) {
    const bridge = useAudioVisualBridge()
    const kick = bridge.getPulse('kick')
    const snare = bridge.getPulse('snare')
    
    useFrame(() => {
        if (meshRef.current) {
            // Audio reactive pulse
            const audioPulse = kick * 0.3 + snare * 0.2
            const targetScale = 1 + (isEditing ? interactionEnergy * 0.2 : 0) + audioPulse
            
            meshRef.current.scale.lerp(
                new THREE.Vector3(targetScale, targetScale, targetScale),
                0.1
            )
            
            // ... rotation logic
        }
    })
    
    // ... rest of component
}
```

---

**END OF CATEGORY 3 (Prompts 31-40)**
