class ScriptProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.memory = new Float32Array(1024);
        this.userProcess = null;
        this.port.onmessage = (e) => {
            if (e.data.type === 'compile') {
                try {
                    // Create reusable process function from string
                    const factory = new Function('memory', 'console', `
                        ${e.data.code}
                        return {
                            init: typeof init !== 'undefined' ? init : null,
                            process: typeof process !== 'undefined' ? process : null
                        }
                    `);
                    const lib = factory(this.memory, console);
                    if (lib.init && typeof lib.init === 'function') lib.init();
                    this.userProcess = lib.process;
                } catch (err) {
                    console.error('[ScriptProcessor] Compile Error:', err);
                }
            }
        };
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        // Pass 1D Float32Array channels to match original ScriptProcessorNode behavior
        if (this.userProcess && input && input.length > 0 && output && output.length > 0) {
            try {
                this.userProcess(input[0], output[0]);
            } catch (err) {
                this.userProcess = null;
                console.error('[ScriptProcessor] Process Error:', err);
            }
        } else if (input && input.length > 0 && output && output.length > 0) {
            // Passthrough if no process function
            output[0].set(input[0]);
        }

        return true;
    }
}

registerProcessor('script-processor', ScriptProcessor);
