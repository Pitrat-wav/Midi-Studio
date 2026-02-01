import { create } from 'zustand'
import Replicate from 'replicate'
import { HfInference } from '@huggingface/inference'

interface AIState {
    replicateKey: string | null
    hfKey: string | null
    isGenerating: boolean
    lastError: string | null
    generatedTextures: string[]
    currentTextureUrl: string | null

    setKeys: (replicate?: string, hf?: string) => void
    generateTexture: (prompt: string, provider?: 'replicate' | 'hf') => Promise<string | null>
    clearHistory: () => void
}

export const useAIStore = create<AIState>((set, get) => ({
    replicateKey: null,
    hfKey: null,
    isGenerating: false,
    lastError: null,
    generatedTextures: [],
    currentTextureUrl: null,

    setKeys: (replicate, hf) => set({
        replicateKey: replicate || get().replicateKey,
        hfKey: hf || get().hfKey
    }),

    generateTexture: async (prompt, provider = 'hf') => {
        set({ isGenerating: true, lastError: null })

        try {
            let url = null

            if (provider === 'hf') {
                const key = get().hfKey
                if (!key) throw new Error("Hugging Face API Key is missing")

                const hf = new HfInference(key)
                const blob = await hf.textToImage({
                    model: 'stabilityai/stable-diffusion-xl-base-1.0',
                    inputs: prompt,
                    parameters: {
                        negative_prompt: 'blurry, low quality, distorted',
                    }
                })
                url = URL.createObjectURL(blob as any)
            } else {
                const key = get().replicateKey
                if (!key) throw new Error("Replicate API Key is missing")

                // Replicate usually needs a proxy or backend for browser usage due to CORS
                // But we'll implement the logic here as a reference
                const replicate = new Replicate({ auth: key })
                const output = await replicate.run(
                    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1d712de0560dc1d052d92147321f0945d82d",
                    { input: { prompt } }
                ) as string[]
                url = output[0]
            }

            if (url) {
                set(s => ({
                    generatedTextures: [url, ...s.generatedTextures],
                    currentTextureUrl: url,
                    isGenerating: false
                }))
                return url
            }
        } catch (err: any) {
            console.error("AI Generation Error:", err)
            set({ lastError: err.message, isGenerating: false })
        }

        return null
    },

    clearHistory: () => set({ generatedTextures: [], currentTextureUrl: null })
}))
