import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useVisualStore } from '../../../store/visualStore'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D tVideo;
  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform float uAudioIntensity;
  uniform vec2 uResolution;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    
    // Feedback offset
    vec2 offset = (uv - 0.5) * (0.005 + uAudioIntensity * 0.02);
    vec4 prev = texture2D(tDiffuse, uv - offset);
    
    // Mirror video
    vec2 videoUv = vec2(1.0 - uv.x, uv.y);
    vec4 video = texture2D(tVideo, videoUv);
    
    // Audio reactive color shift
    video.rgb += vec3(uAudioIntensity * 0.5, 0.0, uAudioIntensity * 0.2) * video.a;
    
    // Edge detection / Difference for nebula effect
    float diff = length(video.rgb - prev.rgb);
    vec4 color = mix(prev * 0.95, video, 0.1 + uAudioIntensity * 0.2);
    
    // Add some glow
    color.rgb += video.rgb * diff * uAudioIntensity * 2.0;

    gl_FragColor = vec4(color.rgb, 1.0);
  }
`

export function FeedbackNebula() {
    const { size, gl } = useThree()
    const fftData = useVisualStore(s => s.fftData)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    const meshRef = useRef<THREE.Mesh>(null!)
    const videoRef = useRef<HTMLVideoElement>(null!)
    const [renderTarget1] = useMemo(() => [
        new THREE.WebGLRenderTarget(size.width, size.height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        })
    ], [size])
    const [renderTarget2] = useMemo(() => [
        new THREE.WebGLRenderTarget(size.width, size.height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        })
    ], [size])

    const readTarget = useRef(renderTarget1)
    const writeTarget = useRef(renderTarget2)

    // Setup webcam
    useEffect(() => {
        const video = document.createElement('video')
        video.autoplay = true
        video.playsInline = true
        video.muted = true
        videoRef.current = video

        navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
            video.srcObject = stream
            video.play()
        }).catch(err => console.error("Webcam access denied", err))

        return () => {
            if (video.srcObject) {
                (video.srcObject as MediaStream).getTracks().forEach(t => t.stop())
            }
        }
    }, [])

    const videoTexture = useMemo(() => {
        if (!videoRef.current) return new THREE.Texture()
        const tex = new THREE.VideoTexture(videoRef.current)
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        return tex
    }, [videoRef.current])

    const uniforms = useMemo(() => ({
        tVideo: { value: videoTexture },
        tDiffuse: { value: null as any },
        uTime: { value: 0 },
        uAudioIntensity: { value: 0 },
        uResolution: { value: new THREE.Vector2(size.width, size.height) }
    }), [videoTexture, size])

    useFrame((state) => {
        const { gl, scene, camera } = state

        uniforms.uTime.value = state.clock.getElapsedTime()
        uniforms.uAudioIntensity.value = intensity
        uniforms.tDiffuse.value = readTarget.current.texture

        // Render feedback loop
        gl.setRenderTarget(writeTarget.current)
        gl.render(scene, camera)
        gl.setRenderTarget(null)

        // Swap targets
        const temp = readTarget.current
        readTarget.current = writeTarget.current
        writeTarget.current = temp
    })

    return (
        <mesh ref={meshRef} position={[0, 0, 0]}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent
            />
        </mesh>
    )
}
