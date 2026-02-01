export const SNAPSHOT_LIBRARY: Record<string, any[]> = {
    drums: [
        { kick: { pulses: 4 }, snare: { pulses: 0 }, hihat: { pulses: 8 } },      // 0: Basic
        { kick: { pulses: 4 }, snare: { pulses: 2 }, hihat: { pulses: 12 } },     // 1: Groov
        { kick: { pulses: 8 }, snare: { pulses: 4 }, hihat: { pulses: 16 } },     // 2: Busy
        { kick: { pulses: 0 }, snare: { pulses: 0 }, hihat: { pulses: 32 } },     // 3: Breakdown
    ],
    bass: [
        { density: 0.3, cutoff: 400, resonance: 1, distortion: 0.2 },              // 0: Deep
        { density: 0.6, cutoff: 800, resonance: 4, distortion: 0.4 },              // 1: Acidic
        { density: 0.8, cutoff: 2000, resonance: 8, distortion: 0.7 },             // 2: Screaming
        { density: 0.1, cutoff: 200, resonance: 0, distortion: 0.1 },              // 3: Sub Only
    ],
    lead: [
        { pulseCount: 1, probability: 1.0 },                                      // 0: Constant
        { pulseCount: 2, probability: 0.7 },                                      // 1: Sparse
        { pulseCount: 4, probability: 0.5 },                                      // 2: Rhythmic
        { pulseCount: 0, probability: 0 },                                        // 3: Silent
    ],
    pads: [
        { brightness: 0.3, complexity: 0.2 },                                     // 0: Ambient
        { brightness: 0.6, complexity: 0.5 },                                     // 1: Rich
        { brightness: 0.9, complexity: 0.8 },                                     // 2: Bright
        { brightness: 0.1, complexity: 0.1 },                                     // 3: Dark
    ],
    sampler: [
        { grainSize: 0.1, overlap: 0.1 },                                         // 0: Clean
        { grainSize: 0.05, overlap: 0.2 },                                        // 1: Gritty
        { grainSize: 0.2, overlap: 0.05 },                                        // 2: Stutter
        { grainSize: 0.4, overlap: 0.01 },                                        // 3: Glitch
    ]
}
