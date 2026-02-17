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

        let val = 0;
        switch (shape) {
            case 'sine':
                val = Math.sin(this.phase * Math.PI * 2);
                break;
            case 'triangle':
                val = 1 - Math.abs((this.phase * 2) - 1) * 2;
                break;
            case 'saw':
                val = (this.phase * 2) - 1;
                break;
            case 'square':
                val = this.phase < 0.5 ? 1 : -1;
                break;
            case 'random':
                if (Math.random() < frequency * delta * 2) {
                    this.lastRandomValue = Math.random() * 2 - 1;
                }
                val = this.lastRandomValue;
                break;
            default:
                val = 0;
        }
        
        // Diagnostic Log (sampled)
        if (Math.random() < 0.01) console.log(`Modulator: ${shape} @ ${frequency}Hz -> ${val.toFixed(3)}`);
        return val;
    }
}
