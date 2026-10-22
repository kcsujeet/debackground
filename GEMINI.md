# deBackground - Project Notes

This file contains notes and instructions for the Gemini agent working on this project.

## Gemini Rules
- Never commit changes without asking for explicit permission first. This is a non-negotiable rule.
- I must always write specs (tests) for any code I write in this project.
- Always let me do the testing. Don't open browser yourself.
- Always generate images in 16:9 aspect ratio for hero and demo assets.

## Current State: Rebranded and Feature Rich
The project has been rebranded from PureBG to **deBackground**. It features a modern design, background image removal, custom background replacement, and real-time background filters.

## Technology Stack
- **Runtime/Package Manager**: Bun
- **Background Removal**: Transformers.js (MIT) - `onnx-community/BEN2-ONNX` on capable
  WebGPU devices, otherwise `studioludens/birefnet-lite-512`
- **Framework**: Astro + React
- **Styling**: Tailwind CSS v4 (Canonical classes)
- **State Management**: Zustand v5

## Milestones Passed
- [x] Switch to Transformers.js for MIT compliance.
- [x] Implement Zustand for editor state.
- [x] UI Modernization (OKLCH, Glassmorphism, Linear-inspired).
- [x] Integrated Interactive Before/After Slider.
- [x] Refined Zoom Precision.
- [x] Switch from `Xenova/modnet` (portrait-only) to BiRefNet_lite for general-purpose
      segmentation, so products, objects, animals and plants work as well as people.
- [x] Settle on the 512x512 BiRefNet_lite export. The 1024x1024 one cannot run here:
      WebGPU needs 11 storage buffers per shader stage against a common adapter cap of
      10, and the CPU backend hits `std::bad_alloc` at that resolution.
- [x] Add BEN2 Base (`onnx-community/BEN2-ONNX`, MIT, fp16 only, 1024x1024) ahead of
      BiRefNet_lite for better non-human subjects, on WebGPU devices only.

## Background Removal Notes
Inputs are capped at `MAX_WORKING_EDGE` (2048px longest edge) by `src/lib/prepare-image.ts`
before anything holds a copy, and travel to the worker as a Blob rather than a base64 data
URL. Both exist because full-resolution phone photos crashed mobile browsers outright: the
pipeline holds roughly six full-size buffers, which at 12 MP is ~300 MB on top of the model.
Raising the cap re-opens that crash.

The model id lives in `src/lib/constants.ts` and is asserted against this file and the
README by `src/tests/docs-consistency.test.ts`, so update the constant rather than the docs.

The worker picks a backend at runtime (`src/workers/select-backend.ts`): WebGPU with fp16
weights (114 MB) where the adapter reports `shader-f16`, otherwise fp32 (224 MB). Retry
policy lives in `src/workers/run-with-fallback.ts`: a backend that throws during load or
inference is dropped permanently and the next one is tried, ending on WASM. Each run logs
its device, dtype and timings to the console under `[background-removal]`.

BiRefNet's heaviest shader binds 11 storage buffers per stage, more than WebGPU's *default*
limit of 10. `createWebGpuDevice()` therefore requests the adapter's own maximum and hands
that device to ONNX Runtime before the first session is created. Adapters reporting less
than `REQUIRED_STORAGE_BUFFERS_PER_STAGE` skip WebGPU altogether: raising the limit cannot
help once the adapter is the ceiling, and attempting it would waste a 114 MB download and
initialise a WebGPU provider the CPU fallback then has to work around.

Every backend decision is logged under `[background-removal]`, including the adapter's
reported limit and the resulting plan. Keep it that way — silent capability probes made
this path very hard to diagnose from bug reports.

BEN2 is tried first when `canTryEnhancedModel()` passes: WebGPU, `shader-f16` (its only
build is fp16), `navigator.deviceMemory` of at least 8 where the browser reports it, and no
earlier failure on this device. That last one lives in `localStorage` via
`src/lib/enhanced-model-memory.ts`, written by the page because workers have no
`localStorage`. The worker posts `attempt` before each model and `attempt-failed` when one
throws; a marker still reading "attempting" on the next load means the tab was killed.
BEN2's storage-buffer need per shader is unmeasured (headless runs of the browser's ONNX
Runtime build crashed), so there is no up-front check for it; an adapter that is too small
fails at runtime and is remembered like any other failure.

## Next Steps
- [ ] Monitor for performance bottlenecks in edge cases.
- [ ] Measure WASM fp32 inference time now that the model fits. If it is intolerable,
      the remaining levers are downscaling large inputs before inference or quantizing
      the model ourselves (no q8 BiRefNet build is published).
- [ ] Confirm `REQUIRED_STORAGE_BUFFERS_PER_STAGE` against this 512 export. It was
      measured on the 1024 build; the architecture is the same so the count should hold,
      but erring high only costs the WebGPU path, never correctness.

