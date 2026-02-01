# Руководство по визуализаторам (Visualizers Guide)

В MIDI Studio Elite 5.0 реализован мощный WebGL-движок, включающий **51 уникальный режим визуализации**. Каждый режим по-своему реагирует на FFT-данные аудиопотока, интенсивность звука и положение рук/тела (при включенном AI Vision).

## Управление
- **Клавиша `/`**: Открыть поиск визуализаторов (в режиме VISUALIZER).
- **Кнопки `1-9`**: Быстрое переключение между первыми 10 слотами.
- **Геймпад (L1/R1)**: Циклическое переключение всех доступных режимов.
- **D-Pad**: Настройка скорости (`Speed`) и детализации (`Detail`).

---

## Список визуализаторов

### Core Visualizers (Классика)
| ID | Название | Иконка | Теги | Описание |
|----|----------|--------|------|----------|
| 0 | Feedback Vortex | 🌀 | abstract, feedback | Гипнотическая воронка с эффектом видео-фидбека. |
| 1 | Quantum Particles | ✨ | particles, space | Облако квантовых частиц, вращающихся в пустоте. |
| 2 | Fractal Mirror | 💎 | fractal, crystal | Геометрический фрактал, отражающий структуру звука. |
| 3 | Neon Weave | 🕸️ | grid, synthwave | Сетка из неоновых нитей в стиле ретро-футуризма. |
| 4 | Plasma Orb | 🔮 | sphere, organic | Органическая плазменная сфера с мягким свечением. |
| 5 | Liquid Mercury | 💧 | fluid, metal | Эффект расплавленного металла, деформируемого басом. |
| 6 | Gravity Well | 🕳️ | particles, physics | Частицы, затягиваемые в черную дыру. |
| 7 | Cyber Tunnel | 🚇 | tunnel, speed | Бесконечный полет сквозь киберпространство. |
| 8 | Kaleido Sphere | 💠 | kaleidoscope | Сложная сферическая калейдоскопическая симметрия. |

### Batch 1: Organic & Space (Органические и Космические)
| ID | Название | Иконка | Теги |
|----|----------|--------|------|
| 9 | Aura Field | 🌫️ | fog, soft, ambient |
| 10 | Circuit City | 🌃 | grid, data, urban |
| 11 | Voxel Waves | 🧱 | voxels, terrain |
| 12 | String Theory | 🎻 | lines, vibrates, strings |
| 13 | Metablob | 🦠 | organic, blobs |
| 14 | Prism Portal | 🌈 | rainbow, refraction |
| 15 | Data Rain | 🔢 | matrix, code, data |
| 16 | Nebula Cloud | ☁️ | clouds, space, gas |
| 17 | Hexagon Grid | ⬢ | hex, geometry |
| 18 | Lidar Scan | 📡 | points, laser, scan |

### Batch 2: Geometry & Chaos (Геометрия и Хаос)
| ID | Название | Иконка | Теги |
|----|----------|--------|------|
| 19 | Hypercube | 🧊 | 4d, cube, geometry |
| 20 | Glitch World | 📟 | glitch, error, digital |
| 21 | Spiral Galaxy | 🌌 | stars, spin, galaxy |
| 22 | Crystal Cave | 🌋 | rocks, reflections |
| 23 | Growth Tendrils | 🌿 | organic, growth |
| 24 | Geometric Chaos | 💥 | cubes, explode |
| 25 | Solar Flare | ☀️ | sun, fire, rays |
| 26 | Depth Rings | ⭕ | rings, distance |
| 27 | Frequency 360 | 📊 | bars, spectrum, round |
| 28 | Triangle Rain | 🔺 | flat, geometry, fall |

### Batch 3: Complex & Shaders (Сложные и Шейдерные)
| ID | Название | Иконка | Теги |
|----|----------|--------|------|
| 29 | Vector Field | ↗️ | arrows, flow, math |
| 30 | Electric Storm | ⚡ | lightning, bolts |
| 31 | Fluid Glass | 🧪 | liquid, morph, clear |
| 32 | Speed Warp | 🌠 | stars, fast, jump |
| 33 | Abstract Solid | 🗿 | sculpture, morph |
| 34 | Laser Grid | 🕹️ | 80s, synthwave |
| 35 | Double Helix | 🧬 | dna, spiral |
| 36 | Pulsar Star | 🔔 | pulse, rings |
| 37 | Fractal Forest | 🌲 | recursive, tree |
| 38 | Glass Shards | 🪟 | broken, pieces |

### Batch 2D: Minimalist & Analytics (2D и Аналитика)
| ID | Название | Иконка | Теги | Описание |
|----|----------|--------|------|----------|
| 39 | Retro Oscilloscope | 📉 | 2d, wave, retro | Зеленая линия классического осциллографа. |
| 40 | Vibrant Spectrum | 📊 | 2d, bars, color | Цветной частотный спектр. |
| 41 | Radial Pulse | 💿 | 2d, circle, pulse | Концентрические круги, расширяющиеся от центра. |
| 42 | Glitch Scanner | 📠 | 2d, glitch, scan | Горизонтальная сканирующая линия с шумом. |
| 43 | Lava Lamp 2D | 🟠 | 2d, blobs, organic | Плавные пятна на базе процедурных шейдеров. |
| 44 | Neon Wavelet | ➰ | 2d, lines, flow | Гибкие неоновые волны. |
| 45 | Binary Star 2D | ✨ | 2d, star, center | Две вращающиеся точки (звезды). |
| 46 | Gradient Flow | 🌈 | 2d, color, smooth | Плавный цветовой градиент, меняющийся от звука. |
| 47 | Pixel Noise | 👾 | 2d, pixels, noise | Ретро-пиксельный шум. |
| 48 | Abstract Grid 2D | ⏹️ | 2d, grid, pattern | Сетка из геометрических примитивов в 2D. |

### Modern Art (Специальные режимы)
| ID | Название | Иконка | Теги | Описание |
|----|----------|--------|------|----------|
| 49 | Mondrian Composition| 🟥 | 2d, art, mondrian | Абстракция в стиле Пита Мондриана (красный, синий, желтый). |
| 50 | Kandinsky Abstract | 🎨 | 2d, art, kandinsky | Композиция из кругов и линий в духе Василия Кандинского. |

---

## Техническая справка
Все визуализаторы построены на связке **React Three Fiber** и **Three.js**. Данные для реактивности поступают из стора `visualStore`, который обновляется через `AudioVisualBridge` на основе анализа FFT (быстрое преобразование Фурье) аудиопотока Tone.js.
