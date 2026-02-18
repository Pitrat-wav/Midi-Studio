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

  void main() {
    vec2 uv = vUv;
    
    // Vortex displacement with Stick Modulation & Speed
    vec2 center = vec2(0.5) + uModifier * 0.2;
    float dist = distance(uv, center);
    float angle = (uTime * uSpeed) * 0.1 + dist * (2.0 + uScale * 10.0 + uDetail * 5.0);
    vec2 rotUv = uv + vec2(cos(angle), sin(angle)) * 0.002 * uAudio;
    
    // Feedback with Trigger-based scaling & Detail
    vec2 feedbackUv = (uv - center) * (0.99 - uAudio * 0.02 - uScale * 0.05 - (1.0 - uDetail) * 0.02) + center;
    vec4 prev = texture2D(tPrev, feedbackUv);
    
    // Webcam input (mirrored)
    vec2 videoUv = vec2(1.0 - uv.x, uv.y);
    vec4 video = texture2D(tVideo, videoUv);
    
    // Luma key effect
    float luma = dot(video.rgb, vec3(0.299, 0.587, 0.114));
    
    // Mix based on luma and audio
    vec4 finalColor = mix(prev * 0.98, video, 0.1 + uAudio * 0.3);
    
    // Color Shift Trigger
    if (uShift > 0.1) {
        finalColor.rgb = finalColor.gbr;
    }

    // Invert Trigger
    if (uInvert > 0.1) {
        finalColor.rgb = 1.0 - finalColor.rgb;
    }

    // Chromatic aberration in the feedback
    finalColor.r = mix(finalColor.r, texture2D(tPrev, feedbackUv + 0.005 * uAudio).r, 0.5);
    finalColor.b = mix(finalColor.b, texture2D(tPrev, feedbackUv - 0.005 * uAudio).b, 0.5);
    
    // Bloom/Glow based on audio
    finalColor.rgb += video.rgb * step(0.6, luma) * uAudio * 2.0;

    gl_FragColor = vec4(finalColor.rgb, 1.0);
  }
`

export function FeedbackVortex() {
    const { size, gl } = useThree()

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

    const videoTexture = useVisualStore(s => s.webcamTexture)

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

        const intensity = useVisualStore.getState().globalAudioIntensity

        uniforms.uTime.value = state.clock.getElapsedTime()
        uniforms.uAudio.value = intensity
        uniforms.uSpeed.value = speed
        uniforms.uDetail.value = detail
        uniforms.uModifier.value.set(modifier.x, -modifier.y)
        uniforms.uShift.value = triggers.visual_shift || 0
        uniforms.uScale.value = triggers.visual_scale || 0
        uniforms.uInvert.value = triggers.visual_invert || 0

        // First pass: render feedback
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
