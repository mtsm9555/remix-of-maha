# MAHA Desktop (Electron)

## Dev
```
npm run dev            # start Vite on http://localhost:8080
npm run electron:dev   # launch Electron pointing at the dev server
```

## Production build
```
npm run build          # bundle the web app to dist/
npm run dist           # package with electron-builder
```

Artifacts in `release/`:
- Windows: `MAHA Setup.exe`
- macOS:   `MAHA.dmg`
- Linux:   `MAHA.AppImage`

Config: `electron-builder.json`, entry: `electron/main.cjs`.
Preload exposes `window.mahaAPI` (see `src/types/electron.d.ts`).
The `/os` header shows a **DESKTOP** badge when running inside Electron.