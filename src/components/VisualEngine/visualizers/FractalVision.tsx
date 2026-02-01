import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D tVideo;
  uniform sampler2D tPrev;
  uniform float uTime;
  uniform float uAudio;
  uniform float uSpeed;
  uniform float uDetail;
  uniform vec2 uResolution;
  uniform vec2 uModifier;
  uniform float uShift;
  uniform float uScale;
  uniform float uInvert;
  varying vec2 vUv;

  vec2 complexMul(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
  }

  void main() {
    vec2 uv = vUv;
    vec2 videoUv = vec2(1.0 - uv.x, uv.y);
    vec3 video = texture2D(tVideo, videoUv).rgb;
    float luma = dot(video, vec3(0.299, 0.587, 0.114));

    // Fractal Julia Set parameters driven by audio, video, Stick and Speed
    float time = uTime * uSpeed;
    vec2 c = vec2(-0.8, 0.156) + vec2(cos(time * 0.5), sin(time * 0.5)) * 0.1;
    c += (video.rg - 0.5) * (0.2 + uDetail * 0.2); 
    c += uModifier * 0.5; // Stick control
    c *= (1.0 + uAudio * 2.0);   

    vec2 z = (uv - 0.5) * (2.0 + uModifier.y * 2.0 + (1.0 - uDetail) * 2.0); // Stick Y zoom + Detail zoom
    z *= (1.0 - uAudio * 0.5 - uScale * 0.3); 

    float iter = 0.0;
    float base_iters = 32.0 + uDetail * 96.0;
    float max_iter = base_iters + uScale * 64.0; // Scale trigger increases detail
    
    for(float i = 0.0; i < 200.0; i++) {
        if (i >= max_iter) break;
        z = complexMul(z, z) + c;
        if(length(z) > 4.0) break;
        iter++;
    }

    float f = iter / max_iter;
    
    vec3 fractalCol = vec3(f * 0.5, f * 0.8, f) + video * 0.5;
    
    // Shift Trigger
    if (uShift > 0.1) fractalCol.rgb = fractalCol.brg;

    vec2 feedbackUv = (uv - 0.5) * (0.98 + uAudio * 0.05 + uScale * 0.02) + 0.5;
    vec3 prev = texture2D(tPrev, feedbackUv).rgb;
    
    if (uAudio > 0.6 || uInvert > 0.1) {
        uv += (fractalCol.rg - 0.5) * (0.1 + uInvert * 0.2);
    }

    vec3 finalColor = mix(fractalCol, prev, 0.9 - uAudio * 0.4);
    
    if (uInvert > 0.1) finalColor.rgb = 1.0 - finalColor.rgb;

    finalColor = mix(finalColor, vec3(1.0, 0.2, 0.5) * f, uAudio);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

export function FractalVision() {
    const { size, gl } = useThree()
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    const videoRef = useRef<HTMLVideoElement>(null!)
    const targets = useMemo(() => {
        const t1 = new THREE.WebGLRenderTarget(size.width, size.height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        })
        const t2 = t1.clone()
        return [t1, t2]
    }, [size])

    const readTarget = useRef(0)

    const [videoTexture, setVideoTexture] = React.useState<THREE.VideoTexture | null>(null)

    useEffect(() => {
        const video = document.createElement('video')
        video.autoplay = true
        video.playsInline = true
        video.muted = true

        navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 60 }
            }
        }).then(stream => {
            video.srcObject = stream
            video.onloadedmetadata = () => {
                video.play()
                const tex = new THREE.VideoTexture(video)
                tex.minFilter = THREE.LinearFilter
                tex.magFilter = THREE.LinearFilter
                setVideoTexture(tex)
            }
        }).catch(err => console.error("Webcam failed", err))

        return () => {
            if (video.srcObject) {
                (video.srcObject as MediaStream).getTracks().forEach(t => t.stop())
            }
        }
    }, [])

    const modifier = useVisualStore(s => s.visualModifier)
    const speed = useVisualStore(s => s.visualSpeed)
    const detail = useVisualStore(s => s.visualDetail)
    const triggers = useVisualStore(s => s.triggers)

    const uniforms = useMemo(() => ({
        tVideo: { value: videoTexture },
        tPrev: { value: null as any },
        uTime: { value: 0 },
        uAudio: { value: 0 },
        uSpeed: { value: 1.0 },
        uDetail: { value: 0.5 },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
        uModifier: { value: new THREE.Vector2(0, 0) },
        uShift: { value: 0 },
        uScale: { value: 0 },
        uInvert: { value: 0 }
    }), [videoTexture, size])

    useFrame((state) => {
        if (!videoTexture) return
        const { gl, scene, camera } = state

        uniforms.uTime.value = state.clock.getElapsedTime()
        uniforms.uAudio.value = intensity
        uniforms.uSpeed.value = speed
        uniforms.uDetail.value = detail
        uniforms.uModifier.value.set(modifier.x, -modifier.y)
        uniforms.uShift.value = triggers.visual_shift || 0
        uniforms.uScale.value = triggers.visual_scale || 0
        uniforms.uInvert.value = triggers.visual_invert || 0

        const read = targets[readTarget.current]
        const write = targets[1 - readTarget.current]
        uniforms.tPrev.value = read.texture

        gl.setRenderTarget(write)
        gl.render(scene, camera)
        gl.setRenderTarget(null)

        readTarget.current = 1 - readTarget.current
    })

    if (!videoTexture) return null

    return (
        <mesh position={[0, 0, 0]}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent={false}
                depthWrite={false}
                depthTest={false}
            />
        </mesh>
    )
}
