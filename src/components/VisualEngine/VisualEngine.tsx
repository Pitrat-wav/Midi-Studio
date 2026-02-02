import React, { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { useVisualStore, VISUALIZER_REGISTRY } from '../../store/visualStore'
import { Stars, OrbitControls, OrthographicCamera, PerspectiveCamera } from '@react-three/drei'
import { usePoseTracking } from '../../hooks/usePoseTracking'

// Visualizers
import { FeedbackVortex } from './visualizers/FeedbackVortex'
import { QuantumParticles } from './visualizers/QuantumParticles'
import { FractalVision } from './visualizers/FractalVision'
import { NeonWeave } from './visualizers/NeonWeave'
import { PlasmaOrb } from './visualizers/PlasmaOrb'
import { LiquidMercury } from './visualizers/LiquidMercury'
import { GravityWell } from './visualizers/GravityWell'
import { CyberTunnel } from './visualizers/CyberTunnel'
import { KaleidoSphere } from './visualizers/KaleidoSphere'

// Batch imports
import * as Batch1 from './visualizers/VisualBatch1'
import * as Batch2 from './visualizers/VisualBatch2'
import * as Batch3 from './visualizers/VisualBatch3'
import * as Batch2D from './visualizers/VisualBatch2D'
import * as VideoBatch from './visualizers/VideoBatch'
import * as Batch2DMega from './visualizers/Batch2D_Mega'
import * as RetroWindows from './visualizers/RetroWindowsBatch'

export function VisualEngine() {
    const index = useVisualStore(s => s.visualizerIndex)
    const intensity = useVisualStore(s => s.globalAudioIntensity)

    // ...


    const currentVisualizer = useMemo(() =>
        VISUALIZER_REGISTRY.find(v => v.id === index),
        [index])

    const is2D = currentVisualizer?.tags.includes('2d')

    usePoseTracking()

    const renderVisualizer = () => {
        // ... switch cases ...
        switch (index) {
            case 0: return <FeedbackVortex />
            case 1: return <QuantumParticles />
            case 2: return <FractalVision />
            case 3: return <NeonWeave />
            case 4: return <PlasmaOrb />
            case 5: return <LiquidMercury />
            case 6: return <GravityWell />
            case 7: return <CyberTunnel />
            case 8: return <KaleidoSphere />

            // Batch 1 (9-18)
            case 9: return <Batch1.AuraField />
            case 10: return <Batch1.CircuitCity />
            case 11: return <Batch1.VoxelWaves />
            case 12: return <Batch1.StringTheory />
            case 13: return <Batch1.Metablob />
            case 14: return <Batch1.PrismPortal />
            case 15: return <Batch1.DataRain />
            case 16: return <Batch1.NebulaCloud />
            case 17: return <Batch1.HexagonGrid />
            case 18: return <Batch1.LidarScan />

            // Batch 2 (19-28)
            case 19: return <Batch2.Hypercube />
            case 20: return <Batch2.GlitchWorld />
            case 21: return <Batch2.SpiralGalaxy />
            case 22: return <Batch2.CrystalCave />
            case 23: return <Batch2.GrowthTendrils />
            case 24: return <Batch2.GeometricChaos />
            case 25: return <Batch2.SolarFlare />
            case 26: return <Batch2.DepthRings />
            case 27: return <Batch2.Frequency360 />
            case 28: return <Batch2.TriangleRain />

            // Batch 3 (29-38)
            case 29: return <Batch3.VectorField />
            case 30: return <Batch3.ElectricStorm />
            case 31: return <Batch3.FluidGlass />
            case 32: return <Batch3.SpeedWarp />
            case 33: return <Batch3.AbstractSolid />
            case 34: return <Batch3.LaserGrid />
            case 35: return <Batch3.DoubleHelix />
            case 36: return <Batch3.PulsarStar />
            case 37: return <Batch3.FractalForest />
            case 38: return <Batch3.GlassShards />

            // Batch 2D (39-48)
            case 39: return <Batch2D.RetroOscilloscope />
            case 40: return <Batch2D.VibrantSpectrum />
            case 41: return <Batch2D.RadialPulse />
            case 42: return <Batch2D.GlitchScanner />
            case 43: return <Batch2D.LavaLamp2D />
            case 44: return <Batch2D.NeonWavelet />
            case 45: return <Batch2D.BinaryStar2D />
            case 46: return <Batch2D.GradientFlow />
            case 47: return <Batch2D.PixelNoise />
            case 48: return <Batch2D.AbstractGrid2D />
            case 49: return <Batch2D.MondrianComposition />
            case 50: return <Batch2D.KandinskyAbstract />

            // Video Batch (51-60)
            case 51: return <VideoBatch.MirrorMask />
            case 52: return <VideoBatch.GhostCam />
            case 53: return <VideoBatch.ThermalVision />
            case 54: return <VideoBatch.AsciiMirror />
            case 55: return <VideoBatch.EdgeDetector />
            case 56: return <VideoBatch.KaleidoMirror />
            case 57: return <VideoBatch.MotionTrails />
            case 58: return <VideoBatch.PixelFace />
            case 59: return <VideoBatch.SlitScan />
            case 60: return <VideoBatch.DatamoshFeed />

            // Mega Batch 2D (61-160)
            case 61: return <Batch2DMega.NeonHorizon />
            case 62: return <Batch2DMega.CyberRain />
            case 63: return <Batch2DMega.DigitalPulse />
            case 64: return <Batch2DMega.Vortex2D />

            // Generated Batch
            case 65: return <Batch2DMega.StarField2D />
            case 66: return <Batch2DMega.CircuitBoard />
            case 67: return <Batch2DMega.LavaFlow />
            case 68: return <Batch2DMega.IceCrystal />
            case 69: return <Batch2DMega.PlasmaWave />
            case 70: return <Batch2DMega.AudioBars />
            case 71: return <Batch2DMega.PolarSpectrum />
            case 72: return <Batch2DMega.GeometricDance />
            case 73: return <Batch2DMega.PixelGlitch />
            case 74: return <Batch2DMega.ShadowPlay />
            case 75: return <Batch2DMega.LiquidGold />
            case 76: return <Batch2DMega.EmeraldCity />
            case 77: return <Batch2DMega.RubyRays />
            case 78: return <Batch2DMega.SapphireSea />
            case 79: return <Batch2DMega.TopazTrail />
            case 80: return <Batch2DMega.QuartzQuartz />
            case 81: return <Batch2DMega.AmethystArcs />
            case 82: return <Batch2DMega.AmberGlow />
            case 83: return <Batch2DMega.ObsidianVoid />
            case 84: return <Batch2DMega.JadeJungle />
            case 85: return <Batch2DMega.PearlPulse />
            case 86: return <Batch2DMega.DiamondDust />
            case 87: return <Batch2DMega.OpalOptics />
            case 88: return <Batch2DMega.GarnetGrid />
            case 89: return <Batch2DMega.SunstoneSpikes />
            case 90: return <Batch2DMega.MoonstoneMist />
            case 91: return <Batch2DMega.MalachiteMaze />
            case 92: return <Batch2DMega.TurquoiseTide />
            case 93: return <Batch2DMega.CoralChaos />
            case 94: return <Batch2DMega.BerylBloom />
            case 95: return <Batch2DMega.ZirconZoom />
            case 96: return <Batch2DMega.PeridotPattern />
            case 97: return <Batch2DMega.SpinelSpin />
            case 98: return <Batch2DMega.TanzaniteTwirl />
            case 99: return <Batch2DMega.ApatiteArp />
            case 100: return <Batch2DMega.MorganiteMorph />
            case 101: return <Batch2DMega.KuntizteKinetic />
            case 102: return <Batch2DMega.IoliteIon />
            case 103: return <Batch2DMega.FluoriteFlow />
            case 104: return <Batch2DMega.SodaliteSoft />
            case 105: return <Batch2DMega.LapisLayer />
            case 106: return <Batch2DMega.PyritePixel />
            case 107: return <Batch2DMega.HematiteHeavy />
            case 108: return <Batch2DMega.AzuriteAxial />
            case 109: return <Batch2DMega.RhodoniteRhythm />
            case 110: return <Batch2DMega.LarimarLake />
            case 111: return <Batch2DMega.CharoiteChill />
            case 112: return <Batch2DMega.SeraphiniteSilk />
            case 113: return <Batch2DMega.PietersitePower />
            case 114: return <Batch2DMega.SugiliteSurge />
            case 115: return <Batch2DMega.PrehnitePulse />
            case 116: return <Batch2DMega.VortexGreen />
            case 117: return <Batch2DMega.VortexRed />
            case 118: return <Batch2DMega.VortexBlue />
            case 119: return <Batch2DMega.MatrixGreen />
            case 120: return <Batch2DMega.MatrixBlue />
            case 121: return <Batch2DMega.MatrixRed />
            case 122: return <Batch2DMega.OceanMist />
            case 123: return <Batch2DMega.DesertMirage />
            case 124: return <Batch2DMega.ArcticAurora />
            case 125: return <Batch2DMega.ForestFloor />
            case 126: return <Batch2DMega.SpaceDust />
            case 127: return <Batch2DMega.Supernova2D />
            case 128: return <Batch2DMega.BlackHole2D />
            case 129: return <Batch2DMega.StarGrid />
            case 130: return <Batch2DMega.CometTail />
            case 131: return <Batch2DMega.NebulaGas />
            case 132: return <Batch2DMega.SolarWind />
            case 133: return <Batch2DMega.LunarShadow />
            case 134: return <Batch2DMega.GravityWave />
            case 135: return <Batch2DMega.QuantumFoam />
            case 136: return <Batch2DMega.ChaosTheory />
            case 137: return <Batch2DMega.FractalFern />
            case 138: return <Batch2DMega.KochSnowflake />
            case 139: return <Batch2DMega.SierpinskiTri />
            case 140: return <Batch2DMega.JuliaSet2D />
            case 141: return <Batch2DMega.Mandelbrot2D />
            case 142: return <Batch2DMega.BurningShip />
            case 143: return <Batch2DMega.BinaryTree />
            case 144: return <Batch2DMega.Feigenbaum />
            case 145: return <Batch2DMega.LorentzAttr />
            case 146: return <Batch2DMega.RosslerAttr />
            case 147: return <Batch2DMega.LangtonsAnt />
            case 148: return <Batch2DMega.GameOfLife />
            case 149: return <Batch2DMega.Wireworld />
            case 150: return <Batch2DMega.CellularWave />
            case 151: return <Batch2DMega.Boids2D />
            case 152: return <Batch2DMega.Pendulum2D />
            case 153: return <Batch2DMega.DoublePendulum />
            case 154: return <Batch2DMega.ElasticGrid />
            case 155: return <Batch2DMega.FluidBox />
            case 156: return <Batch2DMega.MagneticField />
            case 157: return <Batch2DMega.ElectricZap />
            case 158: return <Batch2DMega.RadioWaves />
            case 159: return <Batch2DMega.RadarSweep />
            case 160: return <Batch2DMega.SonarPulse />

            // Retro Windows Batch (161-165)
            case 161: return <RetroWindows.Win98Cascade />
            case 162: return <RetroWindows.BSODGlitch />
            case 163: return <RetroWindows.CursorSphere />
            case 164: return <RetroWindows.XPBlissWarp />
            case 165: return <RetroWindows.IconStorm />

            default: return <Stars />
        }
    }

    return (
        <div className="visual-engine-container" style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: '#000', zIndex: 5
        }}>
            <Canvas
                gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
            >
                <Suspense fallback={null}>
                    <color attach="background" args={['#000']} />

                    {is2D ? (
                        <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={50} />
                    ) : (
                        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={75} />
                    )}

                    {renderVisualizer()}

                    {!is2D && (
                        <>
                            <ambientLight intensity={0.1} />
                            <pointLight position={[10, 10, 10]} intensity={intensity * 5} color="#3390ec" />
                            <pointLight position={[-10, -10, -10]} intensity={intensity * 2} color="#ff3b30" />
                            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                            <OrbitControls enableZoom={false} enablePan={false} />
                        </>
                    )}
                </Suspense>
            </Canvas>
        </div>
    )
}
