import { useAudioStore } from '../store/audioStore'
import { Knob } from './Knob'

export function MixerView() {
    const { volumes, setVolume } = useAudioStore()

    return (
        <section className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Микшер</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <Knob
                    label="Acid"
                    value={volumes.acid}
                    min={0} max={1} step={0.01}
                    onChange={(v) => setVolume('acid', v)}
                    size={60}
                />
                <Knob
                    label="Drums"
                    value={volumes.drums}
                    min={0} max={1} step={0.01}
                    onChange={(v) => setVolume('drums', v)}
                    size={60}
                />
                <Knob
                    label="Pads"
                    value={volumes.pads}
                    min={0} max={1} step={0.01}
                    onChange={(v) => setVolume('pads', v)}
                    size={60}
                />
            </div>
        </section>
    )
}
