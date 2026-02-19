# 🔧 PROMPTS FOR JULES — Midi-Studio 3D Knob Fixes
## Категория 7: MIDI интеграция (Промты 73-80)

---

## 📋 PROMPT 73: MIDI CC mapping система

**Файл:** `src/store/audioStore.ts`, `src/components/WebGL/controls/Knob3D.tsx`

**Проблема:**
Нет системы для маппинга MIDI CC на 3D крутилки.

**Решение:**
Добавить midiCcMap в audioStore:

```tsx
// В audioStore.ts добавить:
interface AudioState {
    // ... existing state ...
    midiCcMap: Record<string, number>  // Map knob labels to CC numbers
    setMidiCcMap: (map: Record<string, number>) => void
    setMidiCcMapping: (label: string, cc: number) => void
}

// В store implementation:
midiCcMap: {},
setMidiCcMap: (map) => set({ midiCcMap: map }),
setMidiCcMapping: (label, cc) => set((state) => ({
    midiCcMap: { ...state.midiCcMap, [label]: cc }
}))
```

---

## 📋 PROMPT 74: Добавить MIDI learn mode

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Решение:**
Добавить режим обучения для MIDI CC:

```tsx
import { useAudioStore } from '../../store/audioStore'

export function Knob3D({ label, ... }: Knob3DProps) {
    const setMidiCcMapping = useAudioStore(s => s.setMidiCcMapping)
    const [isLearnMode, setIsLearnMode] = useState(false)

    // Listen for MIDI messages
    useEffect(() => {
        const handleMidiMessage = (cc: number, value: number) => {
            if (isLearnMode) {
                // Save CC mapping for this knob
                setMidiCcMapping(label, cc)
                setIsLearnMode(false)
                
                if ((window as any).Telegram?.WebApp?.HapticFeedback) {
                    (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success')
                }
            }
        }

        // Subscribe to MIDI events
        // ... implementation

        return () => {
            // Unsubscribe
        }
    }, [isLearnMode, label, setMidiCcMapping])

    return (
        <>
            {/* Knob component */}
            {isLearnMode && (
                <Text position={[0, 1, 0]} fontSize={0.1} color="#00ff00">
                    MOVE MIDI CONTROL
                </Text>
            )}
        </>
    )
}
```

---

## 📋 PROMPT 75: Исправить bidirectional sync

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Проблема:**
MIDI → UI → MIDI loop не работает корректно.

**Решение:**
```tsx
// При получении MIDI CC
useEffect(() => {
    const handleMidiMessage = (cc: number, value: number) => {
        const mappedCc = midiCcMap?.[label]
        if (mappedCc === cc) {
            const normalizedValue = value / 127
            const newValue = min + normalizedValue * (max - min)
            onChange(newValue)
        }
    }

    // Subscribe
    // ...

    return () => {
        // Unsubscribe
    }
}, [label, midiCcMap, min, max, onChange])

// При изменении значения крутилки
const handleValueChange = (newValue: number) => {
    onChange(newValue)
    
    // Send MIDI CC
    const cc = midiCcMap?.[label]
    if (cc !== undefined && navigator.requestMIDIAccess) {
        const midiValue = Math.round((newValue - min) / (max - min) * 127)
        // Send MIDI message
        // ... implementation
    }
}
```

---

## 📋 PROMPT 76: Добавить visual feedback

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Решение:**
Подсветка при получении MIDI сообщения:

```tsx
const [midiActivity, setMidiActivity] = useState(0)

useEffect(() => {
    const handleMidiMessage = (cc: number, value: number) => {
        const mappedCc = midiCcMap?.[label]
        if (mappedCc === cc) {
            setMidiActivity(1.0)
            
            // Decay activity
            setTimeout(() => {
                setMidiActivity(prev => Math.max(0, prev - 0.1))
            }, 100)
        }
    }

    // ... subscribe

    return () => {
        // ... unsubscribe
    }
}, [label, midiCcMap])

// В useFrame
useFrame(() => {
    if (midiActivity > 0.01) {
        setMidiActivity(prev => Math.max(0, prev - 0.02))
    }
})

// Визуальный feedback
<WhiskMaterial
    baseColor={color}
    emissive={color}
    emissiveIntensity={0.3 + midiActivity * 0.7}  // Ярче при MIDI активности
/>
```

---

## 📋 PROMPT 77: Исправить latency

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Проблема:**
Latency при MIDI update может быть высокой.

**Решение:**
Оптимизировать update loop:

```tsx
// Использовать useRef для хранения последнего MIDI значения
const lastMidiValue = useRef<number>(-1)

const handleMidiMessage = (cc: number, value: number) => {
    const mappedCc = midiCcMap?.[label]
    if (mappedCc === cc) {
        const normalizedValue = value / 127
        const newValue = min + normalizedValue * (max - min)
        
        // Обновить только если значение изменилось значительно
        if (Math.abs(newValue - lastMidiValue.current) > 0.01) {
            lastMidiValue.current = newValue
            onChange(newValue)
        }
    }
}
```

---

## 📋 PROMPT 78: Добавить MIDI clock sync

**Файл:** `src/components/WebGL/instruments/DroneEngine3D.tsx`, `src/store/audioStore.ts`

**Решение:**
Синхронизировать LFO крутилки с MIDI clock:

```tsx
// В audioStore.ts добавить:
midiClockTempo: 120,
setMidiClockTempo: (tempo: number) => set({ midiClockTempo: tempo })

// В DroneEngine3D.tsx
const midiClockTempo = useAudioStore(s => s.midiClockTempo)

useFrame((state) => {
    // Синхронизировать LFO с MIDI clock
    const lfoSpeed = (midiClockTempo / 60) * 0.5  // Half note
    meshRef.current.rotation.y += lfoSpeed * 0.01
})
```

---

## 📋 PROMPT 79: Исправить feedback loop

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Проблема:**
MIDI → UI → MIDI → UI infinite loop.

**Решение:**
Использовать флаг для предотвращения loop:

```tsx
const isFromMidi = useRef(false)

const handleMidiMessage = (cc: number, value: number) => {
    const mappedCc = midiCcMap?.[label]
    if (mappedCc === cc) {
        isFromMidi.current = true  // Установить флаг
        const normalizedValue = value / 127
        const newValue = min + normalizedValue * (max - min)
        onChange(newValue)
        
        // Сбросить флаг после короткой задержки
        setTimeout(() => {
            isFromMidi.current = false
        }, 50)
    }
}

const handleValueChange = (newValue: number) => {
    // Не отправлять MIDI если обновление от MIDI
    if (isFromMidi.current) return
    
    onChange(newValue)
    
    // Send MIDI CC
    // ... implementation
}
```

---

## 📋 PROMPT 80: Добавить preset persistence

**Файл:** `src/store/usePresetStore.ts`, `src/store/audioStore.ts`

**Решение:**
Сохранить/загрузить MIDI mappings в presets:

```tsx
// В usePresetStore.ts
interface Preset {
    name: string
    // ... existing fields ...
    midiCcMap: Record<string, number>
}

// Сохранить MIDI mappings
const saveCurrentAs = (name: string) => {
    const midiCcMap = useAudioStore.getState().midiCcMap
    
    const newPreset: Preset = {
        name,
        // ... other fields ...
        midiCcMap
    }
    
    set((state) => ({
        presets: [...state.presets, newPreset]
    }))
}

// Загрузить MIDI mappings
const loadPreset = (index: number) => {
    const preset = presets[index]
    if (preset) {
        useAudioStore.getState().setMidiCcMap(preset.midiCcMap)
        // ... load other fields
    }
}
```

---

**END OF CATEGORY 7 (Prompts 73-80)**

---

# 📊 ИТОГОВЫЙ РЕПОРТ

## Создано 80 промтов для Jules в 7 файлах:

1. **PROMPTS_FOR_JULES_1-15.md** — Критические баги 2D-крутилок (15 промтов)
2. **PROMPTS_FOR_JULES_16-30.md** — 3D Knob3D компонент (15 промтов)
3. **PROMPTS_FOR_JULES_31-40.md** — GenerativeKnob3D (10 промтов)
4. **PROMPTS_FOR_JULES_41-55.md** — Инструмент-specific крутилки (15 промтов)
5. **PROMPTS_FOR_JULES_56-65.md** — GestureManager интеграция (10 промтов)
6. **PROMPTS_FOR_JULES_66-72.md** — CameraController (7 промтов)
7. **PROMPTS_FOR_JULES_73-80.md** — MIDI интеграция (8 промтов)

## Приоритеты выполнения:

**P0 (Критично):** Промты 1-2, 16-18, 41-45
**P1 (Важно):** Промты 3-15, 19-30
**P2 (Средне):** Промты 31-55
**P3 (Дополнительно):** Промты 56-80
