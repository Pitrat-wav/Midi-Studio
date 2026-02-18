# Developer Guide

Welcome to the **Midi Studio** development guide! This document will help you set up the environment, run the project, and contribute effectively.

## 🛠 Prerequisites

*   **Node.js**: v18+ (v20+ recommended)
*   **npm**: v9+
*   **Git**

## 🚀 Installation & Setup

**Important:** This repository tracks part of `node_modules` (specifically platform-dependent binaries). To ensure correct installation without breaking existing dependencies, you **must** use the `--legacy-peer-deps` flag.

1.  **Clone the repository:**
    ```bash
    git clone <repo-url>
    cd midi-studio
    ```

2.  **Install dependencies (Frontend):**
    ```bash
    npm install --legacy-peer-deps
    ```
    *If you encounter issues with `esbuild` or other binaries, try checking out the tracked `node_modules` first:*
    ```bash
    git checkout HEAD -- node_modules
    ```

3.  **Install dependencies (Backend):**
    ```bash
    cd backend
    npm install
    cd ..
    ```

## 💻 Running the Application

### Frontend (Development Server)

Start the Vite development server:

```bash
npm run dev
```
The app will be available at `http://localhost:3000` (or the port shown in the terminal).

### Backend (MIDI Service)

The backend handles MIDI file generation and Telegram integration.

1.  Create a `.env` file in the `backend/` directory based on `.env.example`:
    ```bash
    cp backend/.env.example backend/.env
    ```
2.  Add your `BOT_TOKEN` (from @BotFather) to `backend/.env`.
3.  Start the server:
    ```bash
    cd backend
    npm run dev
    ```
The backend runs on `http://localhost:3001`.

## 🧪 Testing

The project uses the native Node.js test runner via `tsx`.

### Running Unit Tests
```bash
npm test
```
This runs all tests matching `src/**/*.test.ts`.

### Manual Testing
*   **Audio**: Ensure sound plays on user interaction (first click/tap).
*   **Visuals**: Verify the 3D scene renders correctly.
*   **Backend**: Test the "Export MIDI" button (requires backend running).

## 📂 Project Structure

*   `src/store/`: State management (Zustand). Stores for Audio, Visuals, Sequencer.
*   `src/logic/`: Core business logic (AudioNodes, Synths, Sequencing algorithms).
*   `src/components/`: React UI components.
*   `src/components/3D/`: React Three Fiber scenes.
*   `backend/`: Express server for API handling.

## 🤝 Contribution Guidelines

1.  **Code Style**: Follow the existing patterns. Use TypeScript strict mode.
2.  **State**: Prefer Zustand stores over complex React `useState/useEffect` chains for global state.
3.  **Performance**: Avoid heavy computations in the render loop. Use refs for 60fps animations.
4.  **Tests**: Add unit tests for new logic in `src/logic`.

## ⚠️ Troubleshooting

*   **"Module not found" errors**: Run `npm install --legacy-peer-deps` again.
*   **"AudioContext not allowed"**: Interact with the page (click/tap) to unlock audio.
*   **Backend CORS errors**: Ensure `ALLOWED_ORIGINS` in `.env` matches your frontend URL.
