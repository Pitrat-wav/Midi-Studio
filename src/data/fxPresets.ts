export interface FxSettings {
    reverb: { wet: number, decay: number }
    delay: { wet: number, feedback: number, delayTime: string }
    distortion: { wet: number, amount: number }
    compressor: { threshold: number, ratio: number, attack: number, release: number }
    eq: { low: number, lowMid: number, highMid: number, high: number }
}

export const FX_PRESETS: Record<string, FxSettings> = {
    'Default': {
        reverb: { wet: 0.1, decay: 1.5 },
        delay: { wet: 0.0, feedback: 0.3, delayTime: '8n' },
        distortion: { wet: 0.0, amount: 0.0 },
        compressor: { threshold: -24, ratio: 2, attack: 0.01, release: 0.1 },
        eq: { low: 0, lowMid: 0, highMid: 0, high: 0 }
    },
    'Techno Rumble': {
        reverb: { wet: 0.4, decay: 3.0 },
        delay: { wet: 0.2, feedback: 0.5, delayTime: '8n.' },
        distortion: { wet: 0.2, amount: 0.4 },
        compressor: { threshold: -30, ratio: 8, attack: 0.005, release: 0.2 },
        eq: { low: 4, lowMid: -2, highMid: 2, high: 0 }
    },
    'Lo-Fi Crunch': {
        reverb: { wet: 0.1, decay: 0.5 },
        delay: { wet: 0.3, feedback: 0.1, delayTime: '16n' },
        distortion: { wet: 0.6, amount: 0.8 },
        compressor: { threshold: -12, ratio: 4, attack: 0.05, release: 0.5 },
        eq: { low: -3, lowMid: 2, highMid: -1, high: -6 }
    },
    'Bright & Tight': {
        reverb: { wet: 0.2, decay: 1.0 },
        delay: { wet: 0.0, feedback: 0.0, delayTime: '4n' },
        distortion: { wet: 0.0, amount: 0.0 },
        compressor: { threshold: -20, ratio: 4, attack: 0.001, release: 0.05 },
        eq: { low: -1, lowMid: -1, highMid: 2, high: 3 }
    },
    'Deep Space': {
        reverb: { wet: 0.7, decay: 8.0 },
        delay: { wet: 0.5, feedback: 0.7, delayTime: '4n.' },
        distortion: { wet: 0.1, amount: 0.2 },
        compressor: { threshold: -30, ratio: 3, attack: 0.1, release: 0.3 },
        eq: { low: 2, lowMid: 0, highMid: -3, high: -3 }
    },
    'Radio': {
        reverb: { wet: 0.0, decay: 0.1 },
        delay: { wet: 0.0, feedback: 0.0, delayTime: '8n' },
        distortion: { wet: 0.4, amount: 0.6 },
        compressor: { threshold: -15, ratio: 12, attack: 0.02, release: 0.1 },
        eq: { low: -20, lowMid: 5, highMid: 5, high: -20 }
    }
}
