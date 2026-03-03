class ExpressionProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        // Default: passthrough in1
        this.expr = (in1, in2, in3, in4, time, sampleRate) => in1;
        this.port.onmessage = (e) => {
            if (e.data.type === 'compile') {
                try {
                    // Shadow APIs that could exfiltrate data (fetch, WebSocket)
                    // or escape the sandbox (eval, Function).
                    const funcBody = `"use strict";
try { return ${e.data.formula}; } catch(e) { return 0; }`;
                    const factory = new Function(
                        'in1', 'in2', 'in3', 'in4', 'time', 'sampleRate',
                        'fetch', 'WebSocket', 'indexedDB', 'eval', 'Function',
                        funcBody
                    );
                    this.expr = (in1, in2, in3, in4, time, sr) =>
                        factory(in1, in2, in3, in4, time, sr,
                            undefined, undefined, undefined, undefined, undefined);
                } catch (err) {
                    // Fallback to zero on syntax error
                    this.expr = () => 0;
                }
            }
        };
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        if (!output || !output[0]) return true;

        const time = currentTime;
        const sr = sampleRate;

        // Process samples
        for (let i = 0; i < output[0].length; i++) {
            const in1 = (input && input[0]) ? input[0][i] : 0;
            const in2 = (input && input[1]) ? input[1][i] : 0;
            const in3 = (input && input[2]) ? input[2][i] : 0;
            const in4 = (input && input[3]) ? input[3][i] : 0;

            const res = this.expr(in1, in2, in3, in4, time + i / sr, sr);

            // Write to all output channels (mono-to-stereo/multi)
            for (let ch = 0; ch < output.length; ch++) {
                output[ch][i] = res;
            }
        }

        return true;
    }
}

registerProcessor('expression-processor', ExpressionProcessor);
