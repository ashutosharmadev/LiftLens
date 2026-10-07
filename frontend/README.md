# LiftLens frontend

React + TypeScript + Vite. Pose detection and measurement run in the browser (see `docs/adr/002-pose-extraction-in-browser.md`); photos never leave the device.

```sh
npm install
npm run dev     # local dev server
npm test        # unit tests (Vitest)
npm run build   # type-check and production build
```

`src/measure/` holds the measurement engine:

- `models.ts` wraps the MediaPipe pose landmarker and selfie segmenter (browser only).
- `maths.ts` is pure functions on landmarks and mask rows, unit-tested without any model.
