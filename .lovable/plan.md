# MAHA OS — Refactoring & Optimization Plan

A phased plan to reduce duplication, fix correctness issues, improve performance, and harden the architecture. Each phase is independent and shippable.

## Phase 1 — Correctness & Hygiene (quick wins)

1. **AI Gateway auth header** — restore `Lovable-API-Key` header in `src/lib/ai-gateway.server.ts` (per Lovable AI docs; the earlier switch to `Authorization: Bearer` was incorrect for this gateway).
2. **Deprecated APIs** — `.inputValidator()` → `.validator()` across all `*.functions.ts`.
3. **Route file exports** — move `OSPage` out of `src/routes/os.tsx` into `src/components/OSPage.tsx`; both `/` and `/os` import it. Removes the "not code-split" warning and shrinks the initial bundle.
4. **Hydration mismatches** — audit every render-time `typeof window`, `Date.now()`, `Math.random()`, and browser storage read. Move to `useEffect` or `useHydrated()`.
5. **SSR safety** — ensure no browser-only module (Three.js, mic hooks, Electron detection) runs during module evaluation.

## Phase 2 — Audio Pipeline Consolidation

Today three hooks each open their own `getUserMedia` + `AudioContext`: `useMicrophone`, `useVoiceActivity`, and the recorder inside `os.tsx`. Browsers coalesce this, but it wastes CPU, doubles the analyser work, and complicates cleanup.

1. Create `src/services/audioBus.ts` — a singleton that owns one `MediaStream`, one `AudioContext`, and one `AnalyserNode`. Exposes `subscribe(cb)` returning frequency/volume snapshots.
2. Rewrite `useMicrophone` and `useVoiceActivity` as thin subscribers to the bus.
3. Route the `MediaRecorder` in `os.tsx` through the same stream instead of re-requesting mic access.
4. Add ref-counted teardown so the last unsubscriber closes the context.

## Phase 3 — State Machine Unification

`os.tsx` juggles a local `Mode` state, `useAIState` (`derivedState`), realtime flags, and mic state. The mapping logic in `reactorState` is fragile.

1. Extend `services/stateMachine.ts` to be the single source of truth: inputs are `{ recording, transcribing, thinking, streaming, speaking }`.
2. Delete the local `Mode` in `os.tsx`; dispatch events (`START_RECORDING`, `STOPPED`, `STREAM_STARTED`, `STREAM_ENDED`).
3. Every visual component (`ReactorCore`, `CircularWaveform`, `ParticleEngine`, `Reactor3D`) subscribes to the machine, not to prop drilling.

## Phase 4 — Server Function Layout

1. Split `src/lib/mahaCommand.functions.ts` per concern: `ask.functions.ts`, `transcribe.functions.ts`, `vision.functions.ts` — matches the streaming route separation and speeds up server-fn bundling.
2. Move all shared prompt strings/model IDs into `src/lib/ai-config.server.ts`.
3. Ensure every handler reads `process.env.LOVABLE_API_KEY` inside `.handler()` (already correct; add a lint rule/comment).
4. Add zod-typed error envelopes so client can distinguish 402/429/validation errors and render specific UI.

## Phase 5 — Streaming Chat Migration

The `/api/maha/stream` route uses hand-rolled `fetch` + `TextDecoder` in `os.tsx`. Switch to AI SDK UI conventions:

1. Server: return `result.toUIMessageStreamResponse()` (or keep `toTextStreamResponse` if we want text-only).
2. Client: use `useChat` from `@ai-sdk/react` with `DefaultChatTransport` targeting the same route. Removes the reader loop and gives us multi-turn history and retries for free.
3. Persist messages via `useMemory` inside the chat's `onFinish`.

## Phase 6 — Realtime Hardening

`services/realtime.ts` has no reconnect, no backoff, no auth, and silently no-ops when `VITE_REALTIME_URL` is missing.

1. Add exponential backoff reconnect (1s → 30s) and heartbeat ping.
2. Expose `RealtimeState` transitions; UI badge shows `connecting` in addition to `live/offline`.
3. Move `useRealtime` subscription lifecycle to `useSyncExternalStore` — eliminates the effect + `useState` chain and fixes double subscribe under StrictMode.
4. Skip the connect attempt entirely (no console noise) when the env var is unset; render the badge as "disabled".

## Phase 7 — Performance

1. **Lazy heavy visuals** — `ReactorScene` (Three.js) is already lazy; also code-split `ParticleEngine` and `CircularWaveform`. Idle-load with `requestIdleCallback` after first paint.
2. **RAF budget** — merge the three separate `requestAnimationFrame` loops (mic, VAD, particles) into a single tick published by the audio bus. One loop, one `getByteFrequencyData` call per frame.
3. **Memoise `frequencyData`** — currently a new `Uint8Array` is allocated every frame and set into state, causing full React re-renders. Use a ref + `useSyncExternalStore` snapshot to avoid allocations and re-renders.
4. **Bundle audit** — `bun run build && vite-bundle-visualizer`; drop unused shadcn primitives, tree-shake `three` addons.

## Phase 8 — Type Safety & Tests

1. Enable `noUncheckedIndexedAccess` in `tsconfig`; fix `dataArray[i]` style accesses.
2. Add unit tests for `stateMachine`, `audioBus` subscriptions, and the streaming client reader.
3. Add a Playwright smoke test: load `/`, verify reactor renders, send a prompt via CommandBar, assert streamed reply text appears.

## Phase 9 — Observability

1. Wire `reportLovableError` in the existing `__root.tsx` error component (per `tanstack-ssr-error-handling`).
2. Add server-side logging in AI handlers: token count, latency, model, error class — surface 402/429 to the UI.
3. Add a `/debug` route (dev only) showing state machine, audio bus subscribers, realtime status.

## Phase 10 — Documentation

1. Consolidate `prompt.txt`, `DESKTOP.md`, and `MAHA_OS_Blueprint.mmd` under `docs/`.
2. Add `docs/architecture.md` describing the audio bus → state machine → visual layer pipeline.
3. Document the Electron packaging flow with actually-tested commands (`@electron/packager`, not `electron-builder`, per the sandbox constraints).

## Sequencing

Ship Phase 1 immediately (small, all fixes). Phases 2–3 together (they touch the same files). Phase 5 before Phase 6 (chat is user-visible; realtime is secondary). Phases 7–9 as ongoing background work.

## Out of Scope

- No new features. No visual redesign.
- No backend migration (Lovable Cloud stays).
- No Electron packaging changes beyond the docs update.
