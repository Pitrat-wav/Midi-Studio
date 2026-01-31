/**
 * WhiskMaterial — Reactive Material Wrapper for Global Themes
 */

import { useMemo } from 'react'
import * as THREE from 'three'
import { MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei'
import { useVisualStore, AestheticTheme } from '../../store/visualStore'

interface WhiskMaterialProps {
    baseColor?: string
    emissive?: string
    metalness?: number
    roughness?: number
    distort?: number
    speed?: number
    opacity?: number
    transparent?: boolean
    side?: THREE.Side
}

export function WhiskMaterial({
    baseColor = "#ffffff",
    emissive = "#000000",
    metalness = 0.5,
    roughness = 0.5,
    distort = 0.2,
    speed = 1,
    opacity = 1,
    transparent = false,
    side = THREE.FrontSide
}: WhiskMaterialProps) {
    const theme = useVisualStore(s => s.aestheticTheme)

    const themeParams = useMemo(() => {
        switch (theme) {
            case 'cosmic':
                return {
                    color: "#ffffff",
                    emissive: "#ff00ff",
                    metalness: 0.9,
                    roughness: 0.1,
                    distort: 0.4,
                    speed: 2,
                    mapUrl: '/assets/visuals/whisk_preset_1.png'
                }
            case 'cyber':
                return {
                    color: "#ffffff",
                    emissive: "#00ff88",
                    metalness: 1.0,
                    roughness: 0.05,
                    distort: 0.1,
                    speed: 0.5,
                    mapUrl: '/assets/visuals/whisk_preset_2.png'
                }
            case 'pixel':
                return {
                    color: "#ff00ff",
                    emissive: "#ffff00",
                    metalness: 0,
                    roughness: 1.0,
                    distort: 0,
                    speed: 0,
                    mapUrl: '/assets/visuals/whisk_preset_3.png'
                }
            case 'southpark':
                return {
                    color: "#ffffff",
                    emissive: "#ff4444",
                    metalness: 0.6,
                    roughness: 0.4,
                    distort: 0.3,
                    speed: 1.5,
                    mapUrl: '/assets/visuals/south_park_rock.png'
                }
            default:
                return null
        }
    }, [theme])

    // Load texture if theme is active
    const map = useMemo(() => {
        if (!themeParams?.mapUrl) return null
        return new THREE.TextureLoader().load(themeParams.mapUrl)
    }, [themeParams?.mapUrl])

    if (!themeParams) {
        return (
            <meshStandardMaterial
                color={baseColor}
                emissive={emissive}
                metalness={metalness}
                roughness={roughness}
                opacity={opacity}
                transparent={transparent}
                side={side}
            />
        )
    }

    return (
        <MeshDistortMaterial
            map={map}
            color={themeParams.color}
            emissive={themeParams.emissive}
            emissiveIntensity={0.5}
            metalness={themeParams.metalness}
            roughness={themeParams.roughness}
            distort={themeParams.distort}
            speed={themeParams.speed}
            transparent={transparent}
            opacity={opacity}
            side={side}
        />
    )
}
