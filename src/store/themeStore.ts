import { create } from 'zustand'

export interface Theme {
    id: string
    name: string
    colors: {
        bg: string
        surface: string
        primary: string
        secondary: string
        accent: string
        text: string
        border: string
    }
}

const generateRandomTheme = (id: string): Theme => {
    const hue = Math.floor(Math.random() * 360)
    const sat = 50 + Math.floor(Math.random() * 50)
    return {
        id,
        name: `Generated ${id}`,
        colors: {
            bg: `hsl(${hue}, 10%, 5%)`,
            surface: `hsl(${hue}, 15%, 10%)`,
            primary: `hsl(${hue}, ${sat}%, 50%)`,
            secondary: `hsl(${(hue + 180) % 360}, ${sat}%, 40%)`,
            accent: `hsl(${(hue + 90) % 360}, 100%, 60%)`,
            text: '#eeeeee',
            border: `hsl(${hue}, 20%, 20%)`
        }
    }
}

// 50 DISTINCT PRESETS
export const PRESETS: Theme[] = [
    { id: 'default', name: 'Gemini Dark', colors: { bg: '#080808', surface: '#111111', primary: '#00aaff', secondary: '#ffaa00', accent: '#ffffff', text: '#ffffff', border: '#333333' } },
    { id: 'cyberpunk', name: 'Cyberpunk', colors: { bg: '#0b0b18', surface: '#1a1a2e', primary: '#ff00ff', secondary: '#00ffff', accent: '#ffee00', text: '#eaeaea', border: '#444466' } },
    { id: 'matrix', name: 'Matrix', colors: { bg: '#000000', surface: '#0d110d', primary: '#00ff00', secondary: '#003300', accent: '#ccffcc', text: '#00ff00', border: '#004400' } },
    { id: 'vaporwave', name: 'Vaporwave', colors: { bg: '#2b0f3a', surface: '#3e1b52', primary: '#ff71ce', secondary: '#01cdfe', accent: '#fffb96', text: '#ffffff', border: '#6c3275' } },
    { id: 'dracula', name: 'Dracula', colors: { bg: '#282a36', surface: '#44475a', primary: '#bd93f9', secondary: '#ff79c6', accent: '#50fa7b', text: '#f8f8f2', border: '#6272a4' } },
    { id: 'monokai', name: 'Monokai', colors: { bg: '#272822', surface: '#3e3d32', primary: '#a6e22e', secondary: '#66d9ef', accent: '#f92672', text: '#f8f8f2', border: '#75715e' } },
    { id: 'solarized_dark', name: 'Solarized Dark', colors: { bg: '#002b36', surface: '#073642', primary: '#268bd2', secondary: '#d33682', accent: '#859900', text: '#839496', border: '#586e75' } },
    { id: 'solarized_light', name: 'Solarized Light', colors: { bg: '#fdf6e3', surface: '#eee8d5', primary: '#268bd2', secondary: '#d33682', accent: '#859900', text: '#657b83', border: '#93a1a1' } },
    { id: 'nord', name: 'Nord', colors: { bg: '#2e3440', surface: '#3b4252', primary: '#88c0d0', secondary: '#81a1c1', accent: '#bf616a', text: '#d8dee9', border: '#4c566a' } },
    { id: 'gruvbox', name: 'Gruvbox', colors: { bg: '#282828', surface: '#3c3836', primary: '#fabd2f', secondary: '#fe8019', accent: '#b8bb26', text: '#ebdbb2', border: '#504945' } },
    { id: 'forest', name: 'Forest', colors: { bg: '#0f1f0f', surface: '#1b2e1b', primary: '#4caf50', secondary: '#8bc34a', accent: '#cddc39', text: '#e8f5e9', border: '#2e4c2e' } },
    { id: 'ocean', name: 'Ocean', colors: { bg: '#001f3f', surface: '#002b55', primary: '#0074d9', secondary: '#7fdbff', accent: '#39cccc', text: '#ffffff', border: '#004080' } },
    { id: 'volcano', name: 'Volcano', colors: { bg: '#1a0505', surface: '#2d0a0a', primary: '#ff4136', secondary: '#ff851b', accent: '#ffdc00', text: '#fff5f5', border: '#4d1a1a' } },
    { id: 'purple_rain', name: 'Purple Rain', colors: { bg: '#1a0b2e', surface: '#2d1b4e', primary: '#9b59b6', secondary: '#8e44ad', accent: '#d7bde2', text: '#f5eef8', border: '#4a235a' } },
    { id: 'minimal', name: 'Minimal Mono', colors: { bg: '#ffffff', surface: '#f0f0f0', primary: '#000000', secondary: '#333333', accent: '#666666', text: '#111111', border: '#dddddd' } },
    { id: 'blueprint', name: 'Blueprint', colors: { bg: '#0044cc', surface: '#0055dd', primary: '#ffffff', secondary: '#eeeeee', accent: '#ffff00', text: '#ffffff', border: '#ffffff' } },
    { id: 'terminal', name: 'Terminal', colors: { bg: '#0c0c0c', surface: '#1c1c1c', primary: '#cccccc', secondary: '#666666', accent: '#ff3333', text: '#eeeeee', border: '#333333' } },
    { id: 'sunset', name: 'Sunset', colors: { bg: '#2c001e', surface: '#4c0033', primary: '#ff9900', secondary: '#ff0066', accent: '#ffcc00', text: '#fff0e5', border: '#660044' } },
    { id: 'dawn', name: 'Dawn', colors: { bg: '#ffe5e5', surface: '#fff0f0', primary: '#ff6666', secondary: '#ff9999', accent: '#ffcc99', text: '#552222', border: '#ffcccc' } },
    { id: 'midnight', name: 'Midnight', colors: { bg: '#000011', surface: '#000022', primary: '#333399', secondary: '#6666cc', accent: '#9999ff', text: '#ccccff', border: '#000044' } },
    { id: 'alien', name: 'Alien', colors: { bg: '#051105', surface: '#0a220a', primary: '#00ff00', secondary: '#ccff00', accent: '#00ffcc', text: '#ccffcc', border: '#004400' } },
    { id: 'rose', name: 'Rose', colors: { bg: '#fff0f5', surface: '#ffe4e1', primary: '#ff1493', secondary: '#ff69b4', accent: '#db7093', text: '#8b008b', border: '#ffb6c1' } },
    { id: 'slate', name: 'Slate', colors: { bg: '#272b30', surface: '#32383e', primary: '#7a8288', secondary: '#5e646a', accent: '#ffffff', text: '#c8c8c8', border: '#1c1e22' } },
    { id: 'gold', name: 'Gold', colors: { bg: '#1a1500', surface: '#332a00', primary: '#ffd700', secondary: '#ffa500', accent: '#ffeb3b', text: '#ffffe0', border: '#665500' } },
    { id: 'candy', name: 'Candy', colors: { bg: '#fff0ff', surface: '#ffe0ff', primary: '#ff00ff', secondary: '#00ffff', accent: '#ffff00', text: '#330033', border: '#ffccff' } },
    { id: 'toxic', name: 'Toxic', colors: { bg: '#101000', surface: '#202000', primary: '#ccff00', secondary: '#99cc00', accent: '#ff00ff', text: '#eeffee', border: '#444400' } },
    { id: 'royal', name: 'Royal', colors: { bg: '#220033', surface: '#330044', primary: '#9900ff', secondary: '#cc33ff', accent: '#ffcc00', text: '#ffffff', border: '#550066' } },
    { id: 'paper', name: 'Paper', colors: { bg: '#f5f5dc', surface: '#ebebb0', primary: '#8b4513', secondary: '#a0522d', accent: '#d2691e', text: '#3e2723', border: '#d2b48c' } },
    { id: 'hacker', name: 'Hacker', colors: { bg: '#000000', surface: '#111111', primary: '#ff3333', secondary: '#333333', accent: '#ffffff', text: '#ffcccc', border: '#220000' } },
    { id: 'kids', name: 'Kids', colors: { bg: '#ffffff', surface: '#eeeeee', primary: '#ff0000', secondary: '#0000ff', accent: '#ffff00', text: '#000000', border: '#cccccc' } },
    { id: 'lavender', name: 'Lavender', colors: { bg: '#e6e6fa', surface: '#d8bfd8', primary: '#9370db', secondary: '#8a2be2', accent: '#dda0dd', text: '#4b0082', border: '#d8bfd8' } },
    { id: 'mint', name: 'Mint', colors: { bg: '#f5fffa', surface: '#e0eee0', primary: '#00fa9a', secondary: '#00ff7f', accent: '#20b2aa', text: '#006400', border: '#bc8f8f' } },
    { id: 'sepia', name: 'Sepia', colors: { bg: '#704214', surface: '#8b5a2b', primary: '#cd853f', secondary: '#deb887', accent: '#f4a460', text: '#ffdead', border: '#8b4500' } },
    { id: 'grayscale', name: 'Grayscale', colors: { bg: '#222222', surface: '#444444', primary: '#888888', secondary: '#aaaaaa', accent: '#ffffff', text: '#eeeeee', border: '#666666' } },
    { id: 'oled', name: 'OLED', colors: { bg: '#000000', surface: '#000000', primary: '#ffffff', secondary: '#888888', accent: '#444444', text: '#ffffff', border: '#222222' } },
    { id: 'high_contrast', name: 'High Contrast', colors: { bg: '#000000', surface: '#000000', primary: '#ffff00', secondary: '#00ffff', accent: '#ff00ff', text: '#ffffff', border: '#ffffff' } },
    { id: 'coffee', name: 'Coffee', colors: { bg: '#3e2723', surface: '#4e342e', primary: '#d7ccc8', secondary: '#a1887f', accent: '#8d6e63', text: '#efebe9', border: '#5d4037' } },
    { id: 'sky', name: 'Sky', colors: { bg: '#e1f5fe', surface: '#b3e5fc', primary: '#03a9f4', secondary: '#0288d1', accent: '#4fc3f7', text: '#01579b', border: '#81d4fa' } },
    { id: 'fruit', name: 'Fruit', colors: { bg: '#fffbe7', surface: '#fff9c4', primary: '#fbc02d', secondary: '#ffeb3b', accent: '#f57f17', text: '#f57f17', border: '#fff176' } },
    { id: 'bubblegum', name: 'Bubblegum', colors: { bg: '#fce4ec', surface: '#f8bbd0', primary: '#ec407a', secondary: '#f48fb1', accent: '#d81b60', text: '#880e4f', border: '#f06292' } },
    { id: 'lime', name: 'Lime', colors: { bg: '#f9fbe7', surface: '#f0f4c3', primary: '#cddc39', secondary: '#dce775', accent: '#afb42b', text: '#827717', border: '#e6ee9c' } },
    { id: 'amber', name: 'Amber', colors: { bg: '#fff8e1', surface: '#ffecb3', primary: '#ffc107', secondary: '#ffca28', accent: '#ff6f00', text: '#ff6f00', border: '#ffe082' } },
    { id: 'deep_space', name: 'Deep Space', colors: { bg: '#000000', surface: '#0b0b18', primary: '#4444ff', secondary: '#8888ff', accent: '#aaaaaa', text: '#ffffff', border: '#222244' } },
    { id: 'pumpkin', name: 'Pumpkin', colors: { bg: '#3e2723', surface: '#5d4037', primary: '#ff5722', secondary: '#ff7043', accent: '#ffab91', text: '#fbe9e7', border: '#8d6e63' } },
    { id: 'glitch', name: 'Glitch', colors: { bg: '#111111', surface: '#000000', primary: '#ff0044', secondary: '#00ffcc', accent: '#ffffff', text: '#eeeeee', border: '#555555' } },
    { id: 'synthwave', name: 'Synthwave', colors: { bg: '#241734', surface: '#2e2157', primary: '#ff2a6d', secondary: '#05d9e8', accent: '#f9c80e', text: '#ffffff', border: '#6d5a94' } },
    { id: 'cotton_candy', name: 'Cotton Candy', colors: { bg: '#e0f7fa', surface: '#e1bee7', primary: '#80deea', secondary: '#ce93d8', accent: '#f48fb1', text: '#4a148c', border: '#b2ebf2' } },
    { id: 'outrun', name: 'Outrun', colors: { bg: '#100529', surface: '#200b40', primary: '#ff0090', secondary: '#00e1ff', accent: '#ae00ff', text: '#ffffff', border: '#400080' } },
    { id: 'biopunk', name: 'Biopunk', colors: { bg: '#0a1a1a', surface: '#142929', primary: '#00ffaa', secondary: '#00ccaa', accent: '#008888', text: '#e0ffff', border: '#204040' } },
    { id: 'rust', name: 'Rust', colors: { bg: '#2c2220', surface: '#3d2e2a', primary: '#d97d5d', secondary: '#c46445', accent: '#e8b8a8', text: '#eadad6', border: '#5c4640' } }
]

interface ThemeState {
    currentTheme: Theme
    presets: Theme[]
    setTheme: (id: string) => void
    randomizeTheme: () => void
    generateTheme: () => void
}

export const useThemeStore = create<ThemeState>((set) => ({
    currentTheme: PRESETS[0],
    presets: PRESETS,
    setTheme: (id) => {
        const theme = PRESETS.find(p => p.id === id)
        if (theme) {
            set({ currentTheme: theme })
            applyTheme(theme)
        }
    },
    randomizeTheme: () => {
        const random = PRESETS[Math.floor(Math.random() * PRESETS.length)]
        set({ currentTheme: random })
        applyTheme(random)
    },
    generateTheme: () => {
        const newTheme = generateRandomTheme(`custom_${Date.now()}`)
        set({ currentTheme: newTheme })
        applyTheme(newTheme)
    }
}))

const applyTheme = (theme: Theme) => {
    const root = document.documentElement
    root.style.setProperty('--bg-color', theme.colors.bg)
    root.style.setProperty('--surface-color', theme.colors.surface)
    root.style.setProperty('--primary-color', theme.colors.primary)
    root.style.setProperty('--secondary-color', theme.colors.secondary)
    root.style.setProperty('--accent-color', theme.colors.accent)
    root.style.setProperty('--text-color', theme.colors.text)
    root.style.setProperty('--border-color', theme.colors.border)
    // Map to ReactFlow specific vars if needed
    root.style.setProperty('--node-bg', theme.colors.surface)
    root.style.setProperty('--node-border', theme.colors.border)
}
