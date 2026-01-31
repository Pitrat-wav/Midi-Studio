# Algorithmic Deep-Dive — Mathematical Models

This document provides the exact mathematical formulas and logical rules used for the generative engines in Telegram MIDI Studio Pro.

---

## 1. Euclidean Rhythm Engine (Bjorklund)

Used to distribute $k$ pulses over $n$ steps. The algorithm ensures maximum evenness.

### The Bresenham Approximation:
A step $i$ is active if:
$$ \lfloor \frac{i \cdot k}{n} \rfloor \neq \lfloor \frac{(i-1) \cdot k}{n} \rfloor $$
*Where $i \in \{1, \dots, n\}$*

### Bjorklund Grouping (Implemented):
1. Start with $k$ groups of `[1]` and $n-k$ groups of `[0]`.
2. Recursively append the smaller remainder of groups to the larger groups.
3. Stop when the remainder is $0$ or $1$.

---

## 2. Sting Bass Logic (Acid Synthesis)

### Density Function:
Every step $i$ in a 16-step pattern is assigned a deterministic pseudo-random weight $W_i$:
$$ W_i = \text{fract}(\sin(Seed + i \cdot 13.37) \cdot 10000) $$
The step is **active** if:
$$ W_i < \text{Density} $$
*This ensures monotonic growth: increasing density adds notes without moving existing ones.*

### Type Interpolation (Scaler):
The `Type` parameter ($T \in [0, 1]$) controls the note selection pool:
- **$T < 0.3$ (Tonal)**: Pool = $\{R, 3rd, 5th\}$ of the current scale.
- **$0.3 \leq T < 0.7$ (Diatonic)**: Pool = All degrees of the scale.
- **$T \geq 0.7$ (Chromatic)**: Pool = All 12 semitones, with weighted bias towards Blue notes.

---

## 3. Turing Machine (Linear Feedback Shift Register)

A 16-bit register $R$. At every clock pulse:
1. Extract the Most Significant Bit: $B_{out} = (R \gg 15) \& 1$.
2. Determine input bit $B_{in}$:
   - **Locked**: $B_{in} = B_{out}$
   - **Random ($P=1$)**: $B_{in} = \text{rand}(0, 1)$
   - **Evolving ($P=0.5$)**: $B_{in} = \neg B_{out}$ (with 50% probability)
3. Shift and Rotate:
   $$ R_{next} = ((R \ll 1) \mid B_{in}) \& \text{0xFFFF} $$

---

## 4. Harm Synth: Recursive Wavefolding

The Buchla-style timbre control uses recursive folding to increase harmonic content.
For a normalized input $x \in [-1, 1]$, a single folding stage is:
$$ f(x) = 2 \cdot | x - \text{round}(x) | $$
In the Harm Synth, this is cascaded 4 times, modulated by the `Timbre` parameter.

---

## 5. Frequency Modulation (FM)

The Drone and FM Synth use dual-oscillator modulation:
$$ y(t) = A \cdot \sin(2\pi f_c t + I \cdot \sin(2\pi f_m t)) $$
- $f_c$: Carrier Frequency
- $f_m$: Modulator Frequency ($f_c \cdot \text{Harmonicity}$)
- $I$: Modulation Index (controlled by `fmIndex` knob)

---

## 6. MDD Snake: Coordinate Walking

The "Snake" travels on a $4 \times 4$ grid ($16$ cells). Each cell represents a pitch.

### Movement Patterns:
- **Linear**: $i_{next} = (i + 1) \pmod{16}$
- **Zig-Zag**: 
  - If $Row$ is even: $Col \to Col + 1$
  - If $Row$ is odd: $Col \to Col - 1$
- **Spiral**: Iterates through shell indices $[(0,0)\dots(3,3)]$ moving inwards.
- **Random (Brownian)**: $x_{next} = x + \text{rand}(-1, 1)$, $y_{next} = y + \text{rand}(-1, 1)$, clamped to $[0, 3]$.

---

## 7. ML-185: Stage Gate Logic

The sequence is divided into 8 stages. The "Gate Mode" determines how the `AudioContext` envelopes are triggered during the stage's duration ($L \times P$ ticks).

| Mode | Logic | Audio Implementation |
|---|---|---|
| **0 (Mute)** | No Trigger | `return` (Silence) |
| **1 (Single)** | `triggerAttack` at $t=0$, `release` at $t=end$ | $1$ long envelope |
| **2 (Multi)** | `triggerAttack` at every 16th tick | Ratchet/Retrigger effect |
| **3 (Hold)** | No `triggerRelease` | Infinite sustain/Legato to next stage |

---
*End of Technical Specification.*
