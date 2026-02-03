import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useAudioVisualBridge } from '../../../lib/AudioVisualBridge'
import { useVisualStore } from '../../../store/visualStore'

const ANIME_PHRASES = [
    "BOOM! 💥", "MASAKA! 😱", "NANI?! ❓", "SUGOI! ✨",
    "IKUZO! 🚀", "KAWAII~ 😍", "YATTA! 🎉", "SHINEEE! 🔥",
    "B-BAKA! 💢", "ORA ORA! 👊", "MUDA MUDA! 🚫", "PLUS ULTRA! 🌟",
    "POW! 🥊", "ZAP! ⚡", "WHOOSH! 💨"
]

// Project standard webcam hook
// Shared global webcam hook
function useWebcam() {
    return useVisualStore(s => s.webcamTexture)
}

const AnimeShader = {
    uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uLevels: { value: 5.0 },
        uEdgeThreshold: { value: 0.15 },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uIntensity;
        uniform float uLevels;
        uniform float uEdgeThreshold;
        varying vec2 vUv;

        // Simple edge detection
        float getEdge(vec2 uv) {
            float size = 0.0015;
            vec4 center = texture2D(tDiffuse, uv);
            vec4 top = texture2D(tDiffuse, uv + vec2(0, size));
            vec4 bottom = texture2D(tDiffuse, uv + vec2(0, -size));
            vec4 left = texture2D(tDiffuse, uv + vec2(-size, 0));
            vec4 right = texture2D(tDiffuse, uv + vec2(size, 0));
            
            float diff = length(center - top) + length(center - bottom) + length(center - left) + length(center - right);
            return diff > uEdgeThreshold ? 0.0 : 1.0;
        }

        void main() {
            // Mirror flip
            vec2 flippedUv = vec2(1.0 - vUv.x, vUv.y);
            vec4 color = texture2D(tDiffuse, flippedUv);
            
            // Posterization
            color.rgb = floor(color.rgb * uLevels) / uLevels;
            
            // Saturation boost for anime look
            float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
            color.rgb = mix(vec3(gray), color.rgb, 1.6 + uIntensity * 1.0);
            
            // Apply edge
            float edge = getEdge(flippedUv);
            color.rgb *= edge;
            
            // Speed rays effect on high intensity
            if (uIntensity > 0.4) {
                vec2 center = vec2(0.5);
                vec2 toCenter = vUv - center;
                float dist = length(toCenter);
                float angle = atan(toCenter.y, toCenter.x);
                float rays = sin(angle * 15.0 + uTime * 25.0);
                if (rays > 0.8 && dist > 0.2) {
                    color.rgb += vec3(0.4) * (dist - 0.2);
                }
            }

            gl_FragColor = vec4(color.rgb, 1.0);
        }
    `
}

export function Boomy3() {
    const meshRef = useRef<THREE.Mesh>(null!)
    const materialRef = useRef<THREE.ShaderMaterial>(null!)
    const bridge = useAudioVisualBridge()
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const [speech, setSpeech] = useState<string | null>(null)
    const [lastSpeechTime, setLastSpeechTime] = useState(0)

    const texture = useWebcam()

    const uniforms = useMemo(() => ({
        ...THREE.UniformsUtils.clone(AnimeShader.uniforms),
        tDiffuse: { value: null as THREE.VideoTexture | null }
    }), [])

    useEffect(() => {
        if (texture) {
            uniforms.tDiffuse.value = texture
        }
    }, [texture, uniforms])

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        const bridgeIntensity = bridge.getUniforms().uAudioIntensity

        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = t
            materialRef.current.uniforms.uIntensity.value = bridgeIntensity
            if (texture) {
                materialRef.current.uniforms.tDiffuse.value = texture
            }
        }

        // Logic for speech bubbles: lowered threshold for better reactivity
        if (bridgeIntensity > 0.15 && t - lastSpeechTime > 1.0) {
            const randomPhrase = ANIME_PHRASES[Math.floor(Math.random() * ANIME_PHRASES.length)]
            setSpeech(randomPhrase)
            setLastSpeechTime(t)

            setTimeout(() => setSpeech(null), 1000)
        }
    })

    if (!texture) return null // Wait for camera

    return (
        <group>
            <mesh ref={meshRef} scale={[12, 6.75, 1]}>
                <planeGeometry args={[1, 1]} />
                <shaderMaterial
                    ref={materialRef}
                    fragmentShader={AnimeShader.fragmentShader}
                    vertexShader={AnimeShader.vertexShader}
                    uniforms={uniforms}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {speech && (
                <Billboard position={[0, 1.8, 0.5]}>
                    <Html center transform distanceFactor={5} pointerEvents="none">
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            filter: 'drop-shadow(6px 6px 0px rgba(0,0,0,0.6))'
                        }}>
                            <div style={{
                                background: 'white',
                                color: 'black',
                                padding: '15px 30px',
                                borderRadius: '50px 50px 50px 0px',
                                border: '6px solid black',
                                fontFamily: '"Impact", "Bangers", cursive, sans-serif',
                                fontSize: '3rem',
                                fontWeight: '900',
                                whiteSpace: 'nowrap',
                                textTransform: 'uppercase',
                                transform: 'rotate(-2deg)',
                                animation: 'pop-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}>
                                {speech}
                            </div>
                        </div>
                        <style>{`
                            @keyframes pop-in {
                                0% { transform: scale(0.1) rotate(-20deg); opacity: 0; }
                                100% { transform: scale(1) rotate(-2deg); opacity: 1; }
                            }
                        `}</style>
                    </Html>
                </Billboard>
            )}
        </group>
    )
}
