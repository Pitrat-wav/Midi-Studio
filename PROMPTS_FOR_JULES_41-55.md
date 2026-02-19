# 🔧 PROMPTS FOR JULES — Midi-Studio 3D Knob Fixes
## Категория 4: Инструмент-specific крутилки (Промты 41-55)

---

## 📋 PROMPT 41: AcidSynth3D Cutoff/Resonance

**Файл:** `src/components/WebGL/instruments/AcidSynth3D.tsx`

**Проблема:**
LiquidCore компонент использует gesture drag логику но она может конфликтовать с GenerativeKnob3D.

**Текущий код (line 48-72):**
```tsx
// Gesture interaction (Sphere Drag)
const isTarget = gestureState.activeGesture === 'drag' &&
                 gestureState.targetPosition &&
                 gestureState.targetPosition.distanceTo(meshRef.current.position) < 3

if (isTarget) {
    if (!isDragging.current) {
        isDragging.current = true
        initialParams.current = {
            cutoff: bassState.cutoff,
            resonance: bassState.resonance
        }
    }

    const dy = gestureState.currentPos.y - gestureState.startPos.y
    const dx = gestureState.currentPos.x - gestureState.startPos.x

    const newCutoff = THREE.MathUtils.clamp(initialParams.current.cutoff - dy * 50, 50, 10000)
    const newRes = THREE.MathUtils.clamp(initialParams.current.resonance + dx * 0.5, 0.1, 20)

    setParams({ cutoff: newCutoff, resonance: newRes })
}
```

**Решение:**
Разделить Y и X оси для разных параметров:
- Y drag → Cutoff
- X drag → Resonance

Добавить визуальный feedback:

```tsx
// В useFrame добавить визуализацию текущего параметра
const isCutoffActive = Math.abs(dy) > Math.abs(dx)
const activeParam = isCutoffActive ? 'Cutoff' : 'Resonance'

// Показать label активного параметра
<Text position={[0, 3, 0]} fontSize={0.3} color={isCutoffActive ? "#00ffff" : "#ff00ff"}>
    {isDragging.current ? activeParam : ''}
</Text>
```

---

## 📋 PROMPT 42: DrumMachine3D Knob3D

**Файл:** `src/components/WebGL/instruments/DrumMachine3D.tsx`

**Проблема:**
Knob3D в ChannelStrip могут быть слишком маленькими для комфортного взаимодействия.

**Текущий код (line 255-280):**
```tsx
<Knob3D
    position={[-0.8, 0.3, -0.4]}
    value={state.pitch} min={0} max={1}
    label="PITCH" color={color} size={0.6}
    onChange={(v) => setParams(instrument, { pitch: v })}
/>
<Knob3D
    position={[0.8, 0.3, -0.4]}
    value={state.decay} min={0.1} max={1}
    label="DECAY" color={color} size={0.6}
    onChange={(v) => setParams(instrument, { decay: v })}
/>
```

**Решение:**
Увеличить size и улучшить позиционирование:

```tsx
<Knob3D
    position={[-0.8, 0.3, -0.4]}
    value={state.pitch} min={0} max={1}
    label="PITCH" color={color} size={0.8}  // Увеличить с 0.6 до 0.8
    onChange={(v) => setParams(instrument, { pitch: v })}
/>
<Knob3D
    position={[0.8, 0.3, -0.4]}
    value={state.decay} min={0.1} max={1}
    label="DECAY" color={color} size={0.8}
    onChange={(v) => setParams(instrument, { decay: v })}
/>
```

---

## 📋 PROMPT 43: MasterControl3D BPM knob

**Файл:** `src/components/WebGL/instruments/MasterControl3D.tsx`

**Проблема:**
BPM knob имеет диапазон 60-200 что требует высокой точности.

**Текущий код (line 114-122):**
```tsx
<Knob3D
    label="BPM"
    position={[-2.5, 0, 0]}
    value={bpm}
    min={60} max={200}
    onChange={(v) => setBpm(v)}
    color="#ffffff"
/>
```

**Решение:**
Добавить step и sensitivity:

```tsx
<Knob3D
    label="BPM"
    position={[-2.5, 0, 0]}
    value={bpm}
    min={60} max={200}
    step={1}  // Целые значения для BPM
    onChange={(v) => setBpm(Math.round(v))}
    color="#ffffff"
    size={1.0}  // Больший размер для важного контроля
/>
```

---

## 📋 PROMPT 44: MasterControl3D EQ knobs

**Файл:** `src/components/WebGL/instruments/MasterControl3D.tsx`

**Проблема:**
EQ knobs имеют диапазон -12 до +12 dB что требует центрального маркера.

**Текущий код (line 180-210):**
```tsx
<Knob3D
    label="LOW"
    position={[-2.25, 0, 0]}
    value={0}
    min={-12} max={12}
    onChange={(v) => useAudioStore.getState().setMasterEQ('low', v)}
    color="#3390ec"
    size={0.7}
/>
```

**Решение:**
Добавить визуальный центральный маркер (0 dB):

```tsx
// В Knob3D компонент добавить центральный маркер
{value === 0 && (
    <mesh position={[0, 0.1 * size, 0.3 * size]} rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[0.03 * size, 8, 8]} />
        <meshBasicMaterial color="#00ff00" />
    </mesh>
)}
```

---

## 📋 PROMPT 45: PadsSynth3D Brightness/Complexity

**Файл:** `src/components/WebGL/instruments/PadsSynth3D.tsx`

**Проблема:**
Gesture drag логика использует distanceTo но не обновляется плавно.

**Текущий код (line 65-73):**
```tsx
if (gestures.activeGesture === 'drag' && gestures.targetPosition && gestures.targetPosition.distanceTo(new THREE.Vector3(...layout)) < 5) {
    const dx = gestures.currentPos.x - gestures.startPos.x
    const dy = gestures.currentPos.y - gestures.startPos.y
    padStore.setParams({
        brightness: THREE.MathUtils.clamp(padStore.brightness - dy * 0.005, 0, 1),
        complexity: THREE.MathUtils.clamp(padStore.complexity + dx * 0.005, 0, 1)
    })
}
```

**Решение:**
Добавить initial params для консистивного drag:

```tsx
const initialParams = useRef({ brightness: 0, complexity: 0 })

if (gestures.activeGesture === 'drag' && gestures.targetPosition && gestures.targetPosition.distanceTo(new THREE.Vector3(...layout)) < 5) {
    if (!initialParams.current.brightness) {
        initialParams.current = {
            brightness: padStore.brightness,
            complexity: padStore.complexity
        }
    }
    
    const dx = gestures.currentPos.x - gestures.startPos.x
    const dy = gestures.currentPos.y - gestures.startPos.y
    
    padStore.setParams({
        brightness: THREE.MathUtils.clamp(initialParams.current.brightness - dy * 0.005, 0, 1),
        complexity: THREE.MathUtils.clamp(initialParams.current.complexity + dx * 0.005, 0, 1)
    })
} else {
    initialParams.current = { brightness: 0, complexity: 0 }
}
```

---

## 📋 PROMPT 46: HarmSynth3D OSC knobs

**Файл:** `src/components/WebGL/instruments/HarmSynth3D.tsx`

**Проблема:**
Отсутствуют 3D крутилки для OSC секции.

**Решение:**
Добавить Knob3D для каждого OSC:

```tsx
// В конце компонента HarmSynth3D добавить:
{/* OSC 1 Controls */}
<Knob3D
    position={[-4, 0, 2]}
    value={osc1Detune}
    min={-50} max={50}
    label="OSC1 DETUNE"
    onChange={(v) => setParams({ osc1Detune: v })}
    color="#ffcc33"
/>
<Knob3D
    position={[-4, -1, 2]}
    value={osc1Attack}
    min={0.001} max={1}
    label="OSC1 ATTACK"
    onChange={(v) => setParams({ osc1Attack: v })}
    color="#ffcc33"
/>

{/* OSC 2 Controls */}
<Knob3D
    position={[-2, 0, 2]}
    value={osc2Detune}
    min={-50} max={50}
    label="OSC2 DETUNE"
    onChange={(v) => setParams({ osc2Detune: v })}
    color="#ffcc33"
/>
```

---

## 📋 PROMPT 47: DroneEngine3D intensity knob

**Файл:** `src/components/WebGL/instruments/DroneEngine3D.tsx`

**Проблема:**
"The Big Knob" (intensity) требует особого визуального представления.

**Решение:**
Создать крупную центральную крутилку:

```tsx
<Knob3D
    position={[0, 0, 0]}  // Центр
    value={intensity}
    min={0} max={1}
    label="INTENSITY"
    onChange={(v) => setIntensity(v)}
    color="#ff00ff"
    size={1.5}  // Больший размер
/>
```

---

## 📋 PROMPT 48: Sequencer3D probability knobs

**Файл:** `src/components/WebGL/instruments/Sequencer3D.tsx`

**Решение:**
Добавить крутилки для Turing Machine:

```tsx
<Knob3D
    position={[-3, 2, -25]}
    value={turingProb}
    min={0} max={100}
    label="PROBABILITY"
    onChange={(v) => setTuringProb(v)}
    color="#3390ec"
/>
<Knob3D
    position={[-3, 1, -25]}
    value={turingBits}
    min={1} max={16}
    step={1}
    label="BITS"
    onChange={(v) => setTuringBits(Math.round(v))}
    color="#3390ec"
/>
```

---

## 📋 PROMPT 49: Buchla3D wavefolder knobs

**Файл:** `src/components/WebGL/instruments/Buchla3D.tsx`

**Решение:**
Добавить крутилки для complexTimbre и complexOrder:

```tsx
<Knob3D
    position={[23, 3, 0]}
    value={complexTimbre}
    min={0} max={1}
    label="TIMBRE"
    onChange={(v) => setParams({ complexTimbre: v })}
    color="#ffcc33"
/>
<Knob3D
    position={[25, 3, 0]}
    value={complexOrder}
    min={0} max={1}
    label="ORDER"
    onChange={(v) => setParams({ complexOrder: v })}
    color="#ffcc33"
/>
```

---

## 📋 PROMPT 50: Sampler3D filter knobs

**Файл:** `src/components/WebGL/instruments/Sampler3D.tsx`

**Решение:**
Добавить крутилки для фильтра:

```tsx
<Knob3D
    position={[0, 1, 0]}
    value={filterCutoff}
    min={20} max={20000}
    label="CUTOFF"
    onChange={(v) => setFilterCutoff(v)}
    color="#3390ec"
/>
<Knob3D
    position={[2, 1, 0]}
    value={filterResonance}
    min={0.1} max={20}
    label="RESONANCE"
    onChange={(v) => setFilterResonance(v)}
    color="#3390ec"
/>
```

---

## 📋 PROMPT 51: Mixer3D volume faders

**Файл:** `src/components/WebGL/instruments/Mixer3D.tsx`

**Проблема:**
Slider3D может не работать корректно.

**Решение:**
Проверить Slider3D компонент и исправить:

```tsx
// В Slider3D.tsx убедиться что orientation правильный
const orientation: 'vertical' | 'horizontal' = 'vertical'

// Для volume faders использовать vertical orientation
<Slider3D
    position={[13, 0, 15]}
    value={volDrums}
    min={0} max={1}
    label="DRUMS"
    orientation="vertical"
    onChange={(v) => setVolDrums(v)}
    color="#3390ec"
/>
```

---

## 📋 PROMPT 52: Keyboard3D modulation

**Файл:** `src/components/WebGL/instruments/Keyboard3D.tsx`

**Решение:**
Добавить modulation wheel как вертикальный slider:

```tsx
<Slider3D
    position={[-5, 0, 10]}
    value={modulation}
    min={0} max={1}
    label="MOD"
    orientation="vertical"
    onChange={(v) => setModulation(v)}
    color="#3390ec"
/>
```

---

## 📋 PROMPT 53: DrumsScreen 2D knobs

**Файл:** `src/components/HUD/DrumsScreen.tsx`

**Проблема:**
2D StudioKnob не работают в 3D режиме.

**Решение:**
Применить fix из промта 1 для всех StudioKnob в DrumsScreen.

---

## 📋 PROMPT 54: BassScreen FM knobs

**Файл:** `src/components/HUD/BassScreen.tsx`

**Проблема:**
FM harmonicity и modIndex knobs не работают.

**Решение:**
Применить fix из промта 1 для FM knobs:

```tsx
<StudioKnob
    label="Harmonicity"
    value={store.fmHarmonicity}
    min={0.1}
    max={5}
    onChange={(v) => store.setParams({ fmHarmonicity: v })}
    color="blue"
/>
```

---

## 📋 PROMPT 55: SequencerScreen step knobs

**Файл:** `src/components/HUD/SequencerScreen.tsx`

**Решение:**
Добавить 3D совместимость для step knobs.

---

**END OF CATEGORY 4 (Prompts 41-55)**
