# 🔧 PROMPTS FOR JULES — Midi-Studio 3D Knob Fixes
## Категория 1: Критические баги 2D-крутилок в 3D режиме (Промты 1-15)

---

## 📋 PROMPT 1: BassScreen StudioKnob не работают

**Файл:** `src/components/HUD/BassScreen.tsx`, `src/components/HUD/StudioScreen.tsx`

**Проблема:**
Компонент `StudioKnob` использует `<input type="range">` который не работает когда пользователь находится в 3D режиме. Input скрыт (`opacity: 0`) и не получает pointer events правильно.

**Текущий код:**
```tsx
// StudioScreen.tsx line 144-162
<div className={`studio-knob-wrapper studio-knob-${color}`}>
    <div
        className="studio-knob"
        style={{ transform: `rotate(${rotation}deg)` }}
    >
        <div className="knob-marker" />
    </div>
    <input
        type="range"
        min={min}
        max={max}
        step={(max - min) / 100}
        value={value}
        onChange={handleChange}
        className="studio-knob-input"
    />
</div>
```

**Требуемое поведение:**
Заменить input range на pointer events (onPointerDown, onPointerMove, onPointerUp) с визуальным вращением крутилки и обновлением значения.

**Решение:**
```tsx
export const StudioKnob: React.FC<StudioKnobProps> = ({
    label,
    value,
    min = 0,
    max = 100,
    onChange,
    color = 'blue',
    size = 'medium'
}) => {
    const [isDragging, setIsDragging] = useState(false)
    const startY = useRef(0)
    const startValue = useRef(0)
    
    const percentage = ((value - min) / (max - min)) * 100
    const rotation = -135 + (percentage * 2.7)
    
    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true)
        startY.current = e.clientY
        startValue.current = value
        e.currentTarget.setPointerCapture(e.pointerId)
        
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light')
        }
    }
    
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return
        
        const deltaY = startY.current - e.clientY
        const range = max - min
        const sensitivity = 200
        const newValue = Math.min(max, Math.max(min, startValue.current + (deltaY / sensitivity) * range))
        
        if (newValue !== value) {
            onChange(newValue)
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.selectionChanged()
            }
        }
    }
    
    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false)
        e.currentTarget.releasePointerCapture(e.pointerId)
    }
    
    return (
        <div className={`studio-knob-container studio-knob-${size}`}>
            <div
                className={`studio-knob-wrapper studio-knob-${color} ${isDragging ? 'dragging' : ''}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <div
                    className="studio-knob"
                    style={{ 
                        transform: `rotate(${rotation}deg)`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                >
                    <div className="knob-marker" />
                </div>
            </div>
            <span className="studio-knob-label">{label}</span>
            <span className="studio-knob-value">{value.toFixed(1)}</span>
        </div>
    )
}
```

**CSS обновления (StudioScreen.css):**
```css
.studio-knob-wrapper.dragging .studio-knob {
    cursor: ns-resize;
}

.studio-knob-wrapper.dragging {
    box-shadow: 0 0 15px var(--neon-blue-glow);
}
```

---

## 📋 PROMPT 2: DrumsScreen StudioKnob не работают

**Файл:** `src/components/HUD/DrumsScreen.tsx`

**Проблема:**
Аналогична промту 1 — StudioKnob в DrumsScreen используют input range.

**Требуемое поведение:**
Применить то же решение что и в промте 1 для всех StudioKnob в DrumsScreen.

**Контекст:**
DrumsScreen использует StudioKnob для параметров Level и Tune каждого барабана (kick, snare, hihat, etc.)

---

## 📋 PROMPT 3: Добавить визуальный rotation marker

**Файл:** `src/components/HUD/StudioScreen.css`

**Проблема:**
Визуальный маркер (.knob-marker) не вращается вместе с крутилкой, он всегда смотрит вверх.

**Текущий код:**
```css
.knob-marker {
    position: absolute;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 12px;
    background: var(--neon-blue);
}
```

**Решение:**
Маркер должен быть внутри вращающегося элемента .studio-knob и позиционироваться абсолютно:

```css
.studio-knob {
    width: 100%;
    height: 100%;
    border-radius: var(--radius-full);
    background: var(--gradient-metal);
    border: 2px solid rgba(255, 255, 255, 0.1);
    position: relative;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    transition: transform 0.1s;
    cursor: ns-resize;
}

.knob-marker {
    position: absolute;
    top: 4px;
    left: 50%;
    width: 3px;
    height: 10px;
    background: var(--neon-blue);
    border-radius: var(--radius-sm);
    transform: translateX(-50%);
    box-shadow: 0 0 5px var(--neon-blue);
}

.studio-knob-blue .knob-marker { background: var(--neon-blue); }
.studio-knob-amber .knob-marker { background: var(--neon-amber); }
.studio-knob-green .knob-marker { background: var(--neon-green); }
```

---

## 📋 PROMPT 4: Исправить zIndex конфликт

**Файл:** `src/App.css`, `src/components/HUD/StudioScreen.css`

**Проблема:**
2D HUD overlay может не получать pointer events поверх 3D canvas.

**Решение:**
```css
/* StudioScreen.css */
.studio-screen-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    z-index: 1000; /* Выше чем canvas (z-index: 1) */
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
}

.studio-screen {
    pointer-events: auto;
    z-index: 1001;
}

/* App.css */
.scene-container {
    z-index: 1;
}

.control-overlay {
    z-index: 100;
}
```

---

## 📋 PROMPT 5: Добавить haptic feedback

**Файл:** `src/components/HUD/StudioScreen.tsx`

**Проблема:**
Отсутствует haptic feedback при взаимодействии с 2D крутилками.

**Решение:**
Добавить во все handle функции:

```tsx
const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    startY.current = e.clientY
    startValue.current = value
    e.currentTarget.setPointerCapture(e.pointerId)
    
    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light')
    }
}

const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    
    const deltaY = startY.current - e.clientY
    const range = max - min
    const sensitivity = 200
    const newValue = Math.min(max, Math.max(min, startValue.current + (deltaY / sensitivity) * range))
    
    if (newValue !== value) {
        onChange(newValue)
        // Haptic feedback при изменении значения
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.selectionChanged()
        }
    }
}

const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
    
    // Haptic feedback при отпускании
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium')
    }
}
```

---

## 📋 PROMPT 6: Синхронизировать 2D крутилки с 3D сценой

**Файл:** `src/components/HUD/StudioScreen.tsx`, `src/store/visualStore.ts`

**Проблема:**
При drag 2D крутилки нет визуальной связи с 3D сценой.

**Решение:**
Использовать `setInteraction` из visualStore для синхронизации:

```tsx
import { useVisualStore } from '../../store/visualStore'

export const StudioKnob: React.FC<StudioKnobProps> = ({ ... }) => {
    const setInteraction = useVisualStore(s => s.setInteraction)
    
    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true)
        startY.current = e.clientY
        startValue.current = value
        e.currentTarget.setPointerCapture(e.pointerId)
        
        // Set active param for 3D sync
        setInteraction(label, 1.0)
        
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light')
        }
    }
    
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return
        
        const deltaY = startY.current - e.clientY
        const range = max - min
        const sensitivity = 200
        const newValue = Math.min(max, Math.max(min, startValue.current + (deltaY / sensitivity) * range))
        
        if (newValue !== value) {
            onChange(newValue)
            setInteraction(label, 1.0) // Keep energy high while dragging
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.selectionChanged()
            }
        }
    }
    
    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false)
        e.currentTarget.releasePointerCapture(e.pointerId)
        
        // Reset interaction
        setInteraction(null, 0)
        
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium')
        }
    }
    
    // ... rest of component
}
```

---

## 📋 PROMPT 7: Добавить value label update

**Файл:** `src/components/HUD/StudioScreen.tsx`

**Проблема:**
Значение обновляется с задержкой.

**Решение:**
Убедиться что value отображается с правильной точностью:

```tsx
<span className="studio-knob-value">
    {max >= 100 ? Math.round(value) : value.toFixed(1)}
</span>
```

---

## 📋 PROMPT 8: Исправить step precision

**Файл:** `src/components/HUD/StudioScreen.tsx`

**Проблема:**
Step параметр не учитывается при drag.

**Решение:**
```tsx
interface StudioKnobProps {
    label: string
    value: number
    min?: number
    max?: number
    step?: number // Добавить step
    onChange: (value: number) => void
    color?: 'blue' | 'amber' | 'green'
    size?: 'small' | 'medium' | 'large'
}

export const StudioKnob: React.FC<StudioKnobProps> = ({
    step = 0.01, // Default step
    ...
}) => {
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return
        
        const deltaY = startY.current - e.clientY
        const range = max - min
        const sensitivity = 200
        let newValue = startValue.current + (deltaY / sensitivity) * range
        
        // Apply step
        if (step > 0) {
            newValue = Math.round(newValue / step) * step
        }
        
        newValue = Math.min(max, Math.max(min, newValue))
        
        if (newValue !== value) {
            onChange(newValue)
            // ...
        }
    }
}
```

---

## 📋 PROMPT 9: Добавить double-click reset

**Файл:** `src/components/HUD/StudioScreen.tsx`

**Решение:**
```tsx
const handleDoubleClick = () => {
    const defaultValue = (min + max) / 2
    onChange(defaultValue)
    
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
    }
}

return (
    <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        // ...
    >
        {/* ... */}
    </div>
)
```

---

## 📋 PROMPT 10: Добавить keyboard support

**Решение:**
```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
    const stepValue = step || (max - min) / 100
    
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        onChange(Math.min(max, value + stepValue))
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        onChange(Math.max(min, value - stepValue))
    } else if (e.key === 'Home') {
        onChange(min)
    } else if (e.key === 'End') {
        onChange(max)
    }
}

return (
    <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        // ...
    >
        {/* ... */}
    </div>
)
```

---

## 📋 PROMPT 11: Исправить touch events

**Решение:**
Добавить touch события для мобильных:

```tsx
const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    startY.current = touch.clientY
    startValue.current = value
    
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light')
    }
}

const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()
    
    const touch = e.touches[0]
    const deltaY = startY.current - touch.clientY
    const range = max - min
    const sensitivity = 200
    const newValue = Math.min(max, Math.max(min, startValue.current + (deltaY / sensitivity) * range))
    
    if (newValue !== value) {
        onChange(newValue)
    }
}

const handleTouchEnd = () => {
    setIsDragging(false)
    
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium')
    }
}

return (
    <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        // ...
    >
        {/* ... */}
    </div>
)
```

---

## 📋 PROMPT 12: Добавить min/max clamping

**Решение:**
Уже реализовано в handlePointerMove:
```tsx
const newValue = Math.min(max, Math.max(min, startValue.current + (deltaY / sensitivity) * range))
```

---

## 📋 PROMPT 13: Добавить snap-to-grid

**Решение:**
```tsx
const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    
    const deltaY = startY.current - e.clientY
    const range = max - min
    const sensitivity = 200
    let newValue = startValue.current + (deltaY / sensitivity) * range
    
    // Snap-to-grid при зажатом Shift
    if (e.shiftKey && step > 0) {
        const snapStep = step * 10 // Larger snap step
        newValue = Math.round(newValue / snapStep) * snapStep
    } else if (step > 0) {
        newValue = Math.round(newValue / step) * step
    }
    
    newValue = Math.min(max, Math.max(min, newValue))
    
    if (newValue !== value) {
        onChange(newValue)
        // ...
    }
}
```

---

## 📋 PROMPT 14: Исправить cursor styles

**Файл:** `src/components/HUD/StudioScreen.css`

**Решение:**
```css
.studio-knob-wrapper {
    cursor: ns-resize;
}

.studio-knob-wrapper.dragging {
    cursor: grabbing;
}

.studio-knob {
    cursor: inherit;
}
```

---

## 📋 PROMPT 15: Добавить audio visual feedback

**Решение:**
```tsx
import { useAudioVisualBridge } from '../../lib/AudioVisualBridge'

export const StudioKnob: React.FC<StudioKnobProps> = ({ ... }) => {
    const bridge = useAudioVisualBridge()
    
    useEffect(() => {
        const kick = bridge.getPulse('kick')
        const snare = bridge.getPulse('snare')
        const pulse = kick * 0.5 + snare * 0.3
        
        // Apply pulse to knob scale
        const knobElement = document.querySelector(`[data-knob-label="${label}"]`)
        if (knobElement) {
            const scale = 1 + pulse * 0.05
            knobElement.style.transform = `scale(${scale})`
        }
    }, [label, bridge, value])
    
    // ...
}
```

---

**END OF CATEGORY 1 (Prompts 1-15)**
