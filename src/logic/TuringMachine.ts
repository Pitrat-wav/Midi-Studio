/**
 * Turing Machine Logic (Shift Register Sequencer)
 * Based on Music Thing Modular Turing Machine.
 * 
 * A 16-bit shift register that rotates on every clock pulse.
 * The bit that "falls off" the end is either fed back (Lock) 
 * or flipped/randomized (Probability) back into the start.
 */
export class TuringMachine {
    private register: number = 0; // 16-bit

    constructor(initialValue?: number) {
        this.register = (initialValue !== undefined) ? (initialValue & 0xFFFF) : Math.floor(Math.random() * 65536);
    }

    /**
     * Advance the register by one step.
     * @param probability 0.0 (Locked), 1.0 (Random), 0.5 (Evolving)
     * @param isLocked If true, probability is ignored and loop is frozen
     * @returns The new 16-bit register value
     */
    public step(probability: number, isLocked: boolean = false): number {
        // 1. Get the bit that's about to fall off (the 16th bit)
        const lastBit = (this.register >> 15) & 1;

        // 2. Determine the new bit to insert at the 1st position (Bit 0)
        let nextBit = lastBit;

        if (!isLocked) {
            // Classic TM logic: 
            // - If prob = 0, nextBit = lastBit (Loop)
            // - If prob = 1, nextBit = random bit
            // - If prob = 0.5, 50% chance to flip lastBit

            // Standard implementation: 0 is Locked (No change), 1 is Random, 0.5 is Evolving
            // Actually, the Hardware uses a pot where 12 o'clock is 50/50.
            // Let's use the provided logic: "new bit entering is determined by last bit + probability"

            // If probability is 0.5, we have a 50% chance to flip the bit.
            // If probability is 1.0, it's totally random.
            // If probability is 0.0, it's locked.

            if (Math.random() < probability) {
                // If probability is high (towards 1.0), we introduce randomness or flip
                // A common variation: at 0.5 (evolving), we have small chance to flip.
                // At 1.0, we just randomize the bit.

                if (probability >= 1.0) {
                    nextBit = Math.random() > 0.5 ? 1 : 0;
                } else {
                    // Evolving: flip the bit
                    nextBit = lastBit === 1 ? 0 : 1;
                }
            }
        }

        // 3. Shift left by 1 and insert nextBit at the bottom
        // We use a 16-bit mask to keep it within range
        this.register = ((this.register << 1) | nextBit) & 0xFFFF;

        return this.register;
    }

    /**
     * Get a normalized value (0-1) from a subset of bits.
     * @param bitCount How many bits to sum (e.g. 8 for standard TM output)
     */
    public getValue(bitCount: number = 8): number {
        const mask = (1 << bitCount) - 1;
        const subValue = this.register & mask;
        return subValue / mask;
    }

    public getRegister() {
        return this.register;
    }

    public setRegister(val: number) {
        this.register = val & 0xFFFF;
    }
}
