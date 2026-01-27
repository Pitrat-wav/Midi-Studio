export type LfoShape = 'sine' | 'triangle' | 'saw' | 'square' | 'random'

export class Modulator {
    private phase: number = 0;
    private lastRandomValue: number = 0;

    constructor() { }

    /**
     * Calculates the next value for an LFO based on time delta and parameters.
     * Returns a value between -1 and 1.
     */
    getNextValue(shape: LfoShape, frequency: number, delta: number): number {
        this.phase += frequency * delta;
        if (this.phase > 1) this.phase -= 1;

        switch (shape) {
            case 'sine':
                return Math.sin(this.phase * Math.PI * 2);
            case 'triangle':
                return 1 - Math.abs((this.phase * 2) - 1) * 2;
            case 'saw':
                return (this.phase * 2) - 1;
            case 'square':
                return this.phase < 0.5 ? 1 : -1;
            case 'random':
                // We only change random value when phase wraps around approx.
                // Or more simply, we can use frequency to determine "step" rate
                // But for a continuous random, we can interpolate.
                if (Math.random() < frequency * delta * 2) {
                    this.lastRandomValue = Math.random() * 2 - 1;
                }
                return this.lastRandomValue;
            default:
                return 0;
        }
    }
}
