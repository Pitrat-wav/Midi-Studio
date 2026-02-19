# 🔧 PROMPTS FOR JULES — Midi-Studio 3D Knob Fixes
## Категория 2: 3D Knob3D компонент (Промты 16-30)

---

## 📋 PROMPT 16: Исправить cylinderGeometry пропорции

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Проблема:**
Текущая геометрия cylinderGeometry args={[0.3 * size, 0.3 * size, 0.15 * size, 32]} имеет высоту (0.15) которая слишком мала по сравнению с диаметром (0.6). Реальные крутилки имеют высоту примерно 1/3 от диаметра.

**Текущий код (line 172):**
```tsx
<mesh ref={meshRef} ...>
    <cylinderGeometry args={[0.3 * size, 0.3 * size, 0.15 * size, 32]} />
    <WhiskMaterial ... />
</mesh>
```

**Решение:**
```tsx
<cylinderGeometry args={[0.3 * size, 0.3 * size, 0.2 * size, 32]} />
```

Или сделать параметризуемым:
```tsx
const knobDiameter = 0.6 * size
const knobHeight = 0.25 * size  // ~40% от диаметра
<cylinderGeometry args={[knobDiameter / 2, knobDiameter / 2, knobHeight, 32]} />
```

---

## 📋 PROMPT 17: Добавить ring arc визуализацию

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Проблема:**
Нет визуальной индикации диапазона вращения крутилки (от мин до макс).

**Решение:**
Добавить ring geometry с arc (270 градусов) под крутилкой:

```tsx
// Добавить после основного mesh
{/* Range Arc Indicator */}
<mesh position={[0, -0.15 * size, 0]} rotation={[Math.PI / 2, 0, 0]}>
    <ringGeometry args={[0.35 * size, 0.38 * size, 64, 0, -Math.PI * 1.5, Math.PI * 1.5]} />
    <meshBasicMaterial
        color={color}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
    />
</mesh>

{/* Value arc - показывает текущее значение */}
<mesh position={[0, -0.14 * size, 0]} rotation={[Math.PI / 2, 0, targetRotation]}>
    <ringGeometry args={[0.35 * size, 0.38 * size, 64, 0, 0, normalizedValue * Math.PI * 1.5]} />
    <meshBasicMaterial
        color={color}
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
    />
</mesh>
```

---

## 📋 PROMPT 18: Исправить value-to-angle mapping

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Проблема:**
Текущая формула (line 47-49):
```tsx
const targetRotation = useMemo(() => {
    return (normalizedValue - 0.5) * Math.PI * 1.5
}, [normalizedValue])
```

Это дает диапазон от -135° до +135° что правильно, но маркер должен указывать:
- При value=0 (min): -135° (7:30 позиция)
- При value=0.5 (mid): 0° (12:00 позиция)
- При value=1 (max): +135° (4:30 позиция)

**Решение:**
Формула правильная, но нужно убедиться что маркер правильно ориентирован. Проверить line 178:

```tsx
<mesh position={[0, 0.08 * size, 0.25 * size]} rotation={[0, targetRotation, 0]}>
    <boxGeometry args={[0.05 * size, 0.02 * size, 0.15 * size]} />
    <meshBasicMaterial color="#ffffff" />
</mesh>
```

Маркер должен быть смещен к краю цилиндра для лучшей видимости.

---

## 📋 PROMPT 19: Добавить smooth lerp interpolation

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Проблема:**
Текущий lerp factor 0.15 (line 60) может быть слишком медленным или быстрым.

**Текущий код:**
```tsx
useFrame(() => {
    if (meshRef.current) {
        meshRef.current.rotation.y = THREE.MathUtils.lerp(
            meshRef.current.rotation.y,
            targetRotation,
            0.15
        )
        // ...
    }
})
```

**Решение:**
Сделать lerp зависимым от delta time для консистивности на разных refresh rate:

```tsx
useFrame((state, delta) => {
    if (meshRef.current) {
        const lerpFactor = Math.min(0.2, delta * 10) // Адаптивный lerp
        meshRef.current.rotation.y = THREE.MathUtils.lerp(
            meshRef.current.rotation.y,
            targetRotation,
            lerpFactor
        )
        // ...
    }
})
```

---

## 📋 PROMPT 20: Исправить pointer capture

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Проблема:**
Pointer capture не работает на touch устройствах.

**Текущий код (line 76-91):**
```tsx
const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsDragging(true)
    setShowLabel(true)

    const native = e.nativeEvent as any
    dragStartRef.current = {
        x: native.clientX ?? 0,
        y: native.clientY ?? 0,
        initialValue: value
    }

    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light')
    }

    gl.domElement.style.cursor = 'grabbing'
}, [value, gl])
```

**Решение:**
Добавить pointer capture:

```tsx
const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setIsDragging(true)
    setShowLabel(true)

    const native = e.nativeEvent as any
    dragStartRef.current = {
        x: native.clientX ?? 0,
        y: native.clientY ?? 0,
        initialValue: value
    }

    // Pointer capture для touch устройств
    if (native.target && typeof native.target.setPointerCapture === 'function') {
        native.target.setPointerCapture(native.pointerId)
    }

    if ((window as any).Telegram?.WebApp?.HapticFeedback) {
        (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light')
    }

    gl.domElement.style.cursor = 'grabbing'
}, [value, gl])
```

---

## 📋 PROMPT 21: Добавить scroll wheel support

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Проблема:**
Нет поддержки колесика мыши для fine-tuning.

**Решение:**
Добавить onWheel обработчик:

```tsx
const handleWheel = useCallback((e: ThreeEvent<WheelEvent>) => {
    e.stopPropagation()
    
    const delta = e.deltaY > 0 ? -step : step
    let newValue = value + delta
    
    if (step > 0) {
        newValue = Math.round(newValue / step) * step
    }
    newValue = Math.max(min, Math.min(max, newValue))
    
    if (newValue !== value) {
        onChange(newValue)
        if ((window as any).Telegram?.WebApp?.HapticFeedback) {
            (window as any).Telegram.WebApp.HapticFeedback.selectionChanged()
        }
    }
}, [value, min, max, step, onChange])

// В JSX добавить:
<mesh
    ref={meshRef}
    onWheel={handleWheel}
    // ... остальные props
>
```

---

## 📋 PROMPT 22: Исправить hit detection

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Проблема:**
Маленькие крутилки (size < 0.6) трудно попасть pointer events.

**Решение:**
Добавить невидимый hit box большего размера:

```tsx
{/* Invisible hit box for better interaction */}
<mesh
    position={[0, 0, 0]}
    onPointerEnter={(e) => {
        e.stopPropagation()
        setIsHovered(true)
        setShowLabel(true)
        gl.domElement.style.cursor = 'pointer'
    }}
    onPointerLeave={(e) => {
        e.stopPropagation()
        if (!isDragging) {
            setIsHovered(false)
            setShowLabel(false)
            gl.domElement.style.cursor = 'auto'
        }
    }}
    onPointerDown={handlePointerDown}
>
    <cylinderGeometry args={[0.45 * size, 0.45 * size, 0.3 * size, 32]} />
    <meshBasicMaterial transparent opacity={0} />
</mesh>

{/* Visible knob inside hit box */}
<mesh ref={meshRef} ...>
    <cylinderGeometry args={[0.3 * size, 0.3 * size, 0.2 * size, 32]} />
    <WhiskMaterial ... />
</mesh>
```

---

## 📋 PROMPT 23: Добавить tick marks

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Решение:**
Добавить деления по периметру крутилки:

```tsx
{/* Tick marks around the knob */}
{Array.from({ length: 11 }).map((_, i) => {
    const angle = (i / 10) * Math.PI * 1.5 - Math.PI * 0.75
    const x = Math.cos(angle) * 0.35 * size
    const z = Math.sin(angle) * 0.35 * size
    const isMajor = i % 5 === 0
    const tickHeight = isMajor ? 0.03 * size : 0.02 * size
    const tickWidth = isMajor ? 0.02 * size : 0.01 * size
    
    return (
        <mesh
            key={i}
            position={[x, 0.1 * size, z]}
            rotation={[0, -angle, 0]}
        >
            <boxGeometry args={[tickWidth, tickHeight, 0.05 * size]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
    )
})}
```

---

## 📋 PROMPT 24: Добавить center cap

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Решение:**
Добавить декоративную крышку в центре:

```tsx
{/* Center cap */}
<mesh position={[0, 0.12 * size, 0]}>
    <cylinderGeometry args={[0.15 * size, 0.15 * size, 0.05 * size, 16]} />
    <WhiskMaterial
        baseColor="#111111"
        metalness={0.9}
        roughness={0.1}
    />
</mesh>
```

---

## 📋 PROMPT 25: Исправить pivot point

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Проблема:**
Точка вращения должна быть в центре цилиндра.

**Решение:**
Убедиться что геометрия правильно позиционирована:

```tsx
<mesh ref={meshRef} position={[0, 0, 0]}>
    <cylinderGeometry args={[0.3 * size, 0.3 * size, 0.2 * size, 32]} />
    <WhiskMaterial ... />
</mesh>
```

Cylinder geometry в Three.js центрирован по умолчанию, так что pivot point уже правильный.

---

## 📋 PROMPT 26: Добавить emissive glow при hover

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Решение:**
Изменить WhiskMaterial для emissive glow:

```tsx
<WhiskMaterial
    baseColor={color}
    metalness={0.9}
    roughness={0.2}
    emissive={color}
    emissiveIntensity={isHovered || isDragging ? 0.8 : 0.3}
/>
```

---

## 📋 PROMPT 27: Добавить shadow casting

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Решение:**
Добавить castShadow и receiveShadow:

```tsx
<mesh
    ref={meshRef}
    castShadow
    receiveShadow
    // ... остальные props
>
```

---

## 📋 PROMPT 28: Добавить billboard label

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Проблема:**
Text label не всегда facing camera.

**Решение:**
Использовать lookAt для text:

```tsx
{showLabel && (
    <group position={[0, 0.6 * size, 0]}>
        <Text
            ref={(text) => {
                if (text && camera) {
                    text.lookAt(camera.position)
                }
            }}
            fontSize={0.12 * size}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#000000"
        >
            {label}
        </Text>
        {/* ... value text ... */}
    </group>
)}
```

Или использовать Billboard компонент из drei:
```tsx
import { Billboard } from '@react-three/drei'

<Billboard position={[0, 0.6 * size, 0]}>
    <Text
        fontSize={0.12 * size}
        color="#ffffff"
        // ...
    >
        {label}
    </Text>
</Billboard>
```

---

## 📋 PROMPT 29: Исправить size multiplier

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Проблема:**
Size параметр применяется непоследовательно.

**Решение:**
Убедиться что все размеры используют size консистивно:

```tsx
// Все размеры должны масштабироваться от size
const baseRadius = 0.3 * size
const baseHeight = 0.2 * size
const markerLength = 0.15 * size
const labelHeight = 0.6 * size

// Применять ко всем geometry args
```

---

## 📋 PROMPT 30: Добавить LOD system

**Файл:** `src/components/WebGL/controls/Knob3D.tsx`

**Решение:**
Добавить Level of Detail для оптимизации:

```tsx
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

export function Knob3D({ ... }) {
    const { camera } = useThree()
    const [detail, setDetail] = useState(32)
    
    useFrame(() => {
        if (meshRef.current && camera) {
            const distance = camera.position.distanceTo(
                new THREE.Vector3(...position)
            )
            
            // Меньше деталей для далеких объектов
            if (distance > 20) {
                setDetail(16)
            } else if (distance > 10) {
                setDetail(24)
            } else {
                setDetail(32)
            }
        }
    })
    
    return (
        <group ref={groupRef} position={position}>
            <mesh ref={meshRef} ...>
                <cylinderGeometry args={[0.3 * size, 0.3 * size, 0.2 * size, detail]} />
                {/* ... */}
            </mesh>
        </group>
    )
}
```

---

**END OF CATEGORY 2 (Prompts 16-30)**
