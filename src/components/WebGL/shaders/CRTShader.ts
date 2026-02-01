/**
 * CRTShader.ts
 * Green monochrome CRT effect with scanlines and flicker
 */

export const CRTShader = {
    uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        intensity: { value: 1.0 },
        color: { value: [0.0, 1.0, 0.4] } // Classic Fairlight Green
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform float time;
        uniform vec3 color;

        void main() {
            vec2 uv = vUv;
            
            // Scanlines
            float scanline = sin(uv.y * 800.0) * 0.04;
            float slowScan = sin(uv.y * 10.0 + time * 5.0) * 0.02;
            
            // Flicker
            float flicker = sin(time * 50.0) * 0.01 + 0.99;
            
            // Vignette
            float vignette = 1.0 - length(uv - 0.5) * 0.5;
            
            vec3 finalColor = color * (0.8 + scanline + slowScan) * flicker * vignette;
            
            // Phosphor glow
            float glow = exp(-length(uv - 0.5) * 2.0) * 0.1;
            finalColor += color * glow;

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
}
