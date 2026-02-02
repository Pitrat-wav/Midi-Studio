import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useVisualStore } from '../../../store/visualStore'
import * as THREE from 'three'

// Simple hook to get webcam texture
function useWebcam() {
    const [video] = React.useState(() => {
        const v = document.createElement('video')
        v.autoplay = true
        v.playsInline = true
        v.muted = true
        return v
    })

    const [texture, setTexture] = React.useState<THREE.VideoTexture | null>(null)

    useEffect(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
                .then(stream => {
                    video.srcObject = stream
                    video.play()
                    setTexture(new THREE.VideoTexture(video))
                })
                .catch(err => console.error('Webcam error:', err))
        }
        return () => {
            if (video.srcObject) {
                (video.srcObject as MediaStream).getTracks().forEach(t => t.stop())
            }
        }
    }, [video])

    return texture
}

// 51: Mirror Mask
export function MirrorMask() {
    const texture = useWebcam()
    const mesh = useRef<THREE.Mesh>(null!)
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const uniforms = useMemo(() => ({
        uTexture: { value: null as THREE.VideoTexture | null },
        uIntensity: { value: 0 }
    }), [])

    useEffect(() => {
        uniforms.uTexture.value = texture
    }, [texture, uniforms])

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
        }
        uniforms.uIntensity.value = intensity
    })

    if (!texture) return null

    return (
        <mesh ref={mesh}>
            <planeGeometry args={[12, 6.75]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform sampler2D uTexture;
                    uniform float uIntensity;
                    varying vec2 vUv;
                    void main() {
                        vec2 uv = vec2(1.0 - vUv.x, vUv.y);
                        vec4 tex = texture2D(uTexture, uv);
                        gl_FragColor = vec4(tex.rgb + uIntensity * 0.1, 1.0);
                    }
                `}
            />
        </mesh>
    )
}

// 53: Thermal Vision
export function ThermalVision() {
    const texture = useWebcam()
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const uniforms = useMemo(() => ({
        uTexture: { value: null as THREE.VideoTexture | null },
        uIntensity: { value: 0 },
        uTime: { value: 0 }
    }), [])

    useEffect(() => {
        uniforms.uTexture.value = texture
    }, [texture, uniforms])

    useFrame((state) => {
        uniforms.uTime.value = state.clock.elapsedTime
        uniforms.uIntensity.value = intensity
    })

    if (!texture) return null

    return (
        <mesh>
            <planeGeometry args={[16, 9]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform sampler2D uTexture;
                    uniform float uIntensity;
                    uniform float uTime;
                    varying vec2 vUv;

                    void main() {
                        vec4 tex = texture2D(uTexture, vec2(1.0 - vUv.x, vUv.y));
                        float grayscale = (tex.r + tex.g + tex.b) / 3.0;
                        
                        vec3 hot = vec3(1.0, 0.9, 0.0);
                        vec3 mid = vec3(1.0, 0.0, 0.0);
                        vec3 cold = vec3(0.0, 0.0, 0.5);
                        
                        vec3 thermal = vec3(0.0);
                        if (grayscale > 0.5) {
                            thermal = mix(mid, hot, (grayscale - 0.5) * 2.0);
                        } else {
                            thermal = mix(cold, mid, grayscale * 2.0);
                        }
                        
                        gl_FragColor = vec4(thermal + uIntensity * 0.5, 1.0);
                    }
                `}
            />
        </mesh>
    )
}

// 54: ASCII Mirror
export function AsciiMirror() {
    const texture = useWebcam()
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const uniforms = useMemo(() => ({
        uTexture: { value: null as THREE.VideoTexture | null },
        uIntensity: { value: 0 },
        uResolution: { value: new THREE.Vector2(80, 60) }
    }), [])

    useEffect(() => {
        uniforms.uTexture.value = texture
    }, [texture, uniforms])

    useFrame(() => {
        uniforms.uIntensity.value = intensity
    })

    if (!texture) return null

    return (
        <mesh>
            <planeGeometry args={[16, 9]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform sampler2D uTexture;
                    uniform vec2 uResolution;
                    uniform float uIntensity;
                    varying vec2 vUv;

                    void main() {
                        vec2 gridUv = floor(vUv * uResolution) / uResolution;
                        vec4 tex = texture2D(uTexture, vec2(1.0 - gridUv.x, gridUv.y));
                        float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
                        
                        float char = 0.0;
                        if (luma > 0.8) char = 0.9;
                        else if (luma > 0.6) char = 0.6;
                        else if (luma > 0.4) char = 0.3;
                        else if (luma > 0.2) char = 0.1;
                        
                        vec3 col = vec3(0.0, 1.0, 0.0) * char;
                        gl_FragColor = vec4(col + uIntensity * 0.2, 1.0);
                    }
                `}
            />
        </mesh>
    )
}

// 55: Edge Detector
export function EdgeDetector() {
    const texture = useWebcam()
    const uniforms = useMemo(() => ({
        uTexture: { value: null as THREE.VideoTexture | null },
        uIntensity: { value: 0 }
    }), [])

    useEffect(() => {
        uniforms.uTexture.value = texture
    }, [texture, uniforms])

    useFrame(() => {
        uniforms.uIntensity.value = useVisualStore.getState().globalAudioIntensity
    })

    if (!texture) return null

    return (
        <mesh>
            <planeGeometry args={[16, 9]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform sampler2D uTexture;
                    uniform float uIntensity;
                    varying vec2 vUv;

                    void main() {
                        float offset = 1.0 / 512.0;
                        vec3 t = texture2D(uTexture, vUv + vec2(0, offset)).rgb;
                        vec3 b = texture2D(uTexture, vUv + vec2(0, -offset)).rgb;
                        vec3 l = texture2D(uTexture, vUv + vec2(-offset, 0)).rgb;
                        vec3 r = texture2D(uTexture, vUv + vec2(offset, 0)).rgb;
                        
                        vec3 diff = abs(t - b) + abs(l - r);
                        float edge = (diff.r + diff.g + diff.b) / 3.0;
                        
                        vec3 col = mix(vec3(0.0), vec3(0.0, 0.8, 1.0), edge * 5.0);
                        gl_FragColor = vec4(col + uIntensity * 1.0, 1.0);
                    }
                `}
            />
        </mesh>
    )
}

// 56: Kaleido Mirror
export function KaleidoMirror() {
    const texture = useWebcam()
    const uniforms = useMemo(() => ({
        uTexture: { value: null as THREE.VideoTexture | null },
        uTime: { value: 0 }
    }), [])

    useEffect(() => {
        uniforms.uTexture.value = texture
    }, [texture, uniforms])

    useFrame((state) => {
        uniforms.uTime.value = state.clock.elapsedTime
    })

    if (!texture) return null

    return (
        <mesh>
            <planeGeometry args={[16, 9]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform sampler2D uTexture;
                    uniform float uTime;
                    varying vec2 vUv;

                    void main() {
                        vec2 p = vUv - 0.5;
                        float r = length(p);
                        float a = atan(p.y, p.x) + uTime * 0.1;
                        
                        float sides = 6.0;
                        float tau = 6.283185;
                        a = mod(a, tau/sides);
                        a = abs(a - tau/sides/2.0);
                        
                        vec2 uv = vec2(r * cos(a), r * sin(a)) + 0.5;
                        gl_FragColor = texture2D(uTexture, uv);
                    }
                `}
            />
        </mesh>
    )
}

// 52: Ghost Cam (Temporal Feedback)
export function GhostCam() {
    const texture = useWebcam()
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const uniforms = useMemo(() => ({
        uTexture: { value: null as THREE.VideoTexture | null },
        uIntensity: { value: 0 },
        uTime: { value: 0 }
    }), [])

    useEffect(() => {
        uniforms.uTexture.value = texture
    }, [texture, uniforms])

    useFrame((state) => {
        uniforms.uTime.value = state.clock.elapsedTime
        uniforms.uIntensity.value = intensity
    })

    if (!texture) return null

    return (
        <mesh>
            <planeGeometry args={[16, 9]} />
            <shaderMaterial
                uniforms={uniforms}
                transparent
                vertexShader={`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform sampler2D uTexture;
                    uniform float uIntensity;
                    uniform float uTime;
                    varying vec2 vUv;

                    void main() {
                        vec2 uv = vec2(1.0 - vUv.x, vUv.y);
                        vec4 tex = texture2D(uTexture, uv);
                        float delay = sin(uTime * 2.0) * 0.05;
                        vec4 texGhost = texture2D(uTexture, uv + vec2(delay, 0.0));
                        
                        vec3 col = mix(tex.rgb, texGhost.rgb, 0.5 + uIntensity * 0.5);
                        gl_FragColor = vec4(col, 1.0);
                    }
                `}
            />
        </mesh>
    )
}

// 57: Motion Trails
export function MotionTrails() {
    const texture = useWebcam()
    const intensity = useVisualStore(s => s.globalAudioIntensity)
    const uniforms = useMemo(() => ({
        uTexture: { value: null as THREE.VideoTexture | null },
        uIntensity: { value: 0 },
        uTime: { value: 0 }
    }), [])

    useEffect(() => {
        uniforms.uTexture.value = texture
    }, [texture, uniforms])

    useFrame((state) => {
        uniforms.uTime.value = state.clock.elapsedTime
        uniforms.uIntensity.value = intensity
    })

    if (!texture) return null

    return (
        <mesh>
            <planeGeometry args={[16, 9]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform sampler2D uTexture;
                    uniform float uIntensity;
                    uniform float uTime;
                    varying vec2 vUv;

                    void main() {
                        vec2 uv = vec2(1.0 - vUv.x, vUv.y);
                        vec4 tex = texture2D(uTexture, uv);
                        float scan = sin(uv.y * 100.0 + uTime * 10.0) * 0.1;
                        
                        vec3 col = tex.rgb;
                        if (uIntensity > 0.5) {
                            col += vec3(1.0, 0.0, 1.0) * scan;
                        }
                        
                        gl_FragColor = vec4(col, 1.0);
                    }
                `}
            />
        </mesh>
    )
}

// 58: Pixel Face
export function PixelFace() {
    const texture = useWebcam()
    const uniforms = useMemo(() => ({
        uTexture: { value: null as THREE.VideoTexture | null },
        uIntensity: { value: 0 }
    }), [])

    useEffect(() => {
        uniforms.uTexture.value = texture
    }, [texture, uniforms])

    useFrame(() => {
        uniforms.uIntensity.value = useVisualStore.getState().globalAudioIntensity
    })

    if (!texture) return null

    return (
        <mesh>
            <planeGeometry args={[16, 9]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform sampler2D uTexture;
                    uniform float uIntensity;
                    varying vec2 vUv;

                    void main() {
                        float size = 32.0 + uIntensity * 64.0;
                        vec2 uv = floor(vUv * size) / size;
                        uv.x = 1.0 - uv.x;
                        
                        vec4 tex = texture2D(uTexture, uv);
                        gl_FragColor = tex;
                    }
                `}
            />
        </mesh>
    )
}

// 59: Slit Scan
export function SlitScan() {
    const texture = useWebcam()
    const uniforms = useMemo(() => ({
        uTexture: { value: null as THREE.VideoTexture | null },
        uTime: { value: 0 }
    }), [])

    useEffect(() => {
        uniforms.uTexture.value = texture
    }, [texture, uniforms])

    useFrame((state) => {
        uniforms.uTime.value = state.clock.elapsedTime
    })

    if (!texture) return null

    return (
        <mesh>
            <planeGeometry args={[16, 9]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform sampler2D uTexture;
                    uniform float uTime;
                    varying vec2 vUv;

                    void main() {
                        float wave = sin(vUv.y * 10.0 + uTime) * 0.1;
                        vec2 uv = vec2(1.0 - vUv.x + wave, vUv.y);
                        gl_FragColor = texture2D(uTexture, uv);
                    }
                `}
            />
        </mesh>
    )
}

// 60: Datamosh Feed
export function DatamoshFeed() {
    const texture = useWebcam()
    const uniforms = useMemo(() => ({
        uTexture: { value: null as THREE.VideoTexture | null },
        uTime: { value: 0 }
    }), [])

    useEffect(() => {
        uniforms.uTexture.value = texture
    }, [texture, uniforms])

    useFrame((state) => {
        uniforms.uTime.value = state.clock.elapsedTime
    })

    if (!texture) return null

    return (
        <mesh>
            <planeGeometry args={[16, 9]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={`
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `}
                fragmentShader={`
                    uniform sampler2D uTexture;
                    uniform float uTime;
                    varying vec2 vUv;

                    void main() {
                        vec2 uv = vec2(1.0 - vUv.x, vUv.y);
                        if (mod(uTime, 2.0) > 1.8) {
                           uv += vec2(sin(uv.y * 100.0) * 0.05, 0.0);
                        }
                        gl_FragColor = texture2D(uTexture, uv);
                    }
                `}
            />
        </mesh>
    )
}
