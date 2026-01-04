# Gemini Project Notes

This file contains notes and instructions for the Gemini agent working on this project.

## Current Task: Switched back to Transformers.js (MIT)
The project is moving back to a custom Transformers.js implementation using `onnx-community/BiRefNet_lite-ONNX` to ensure an MIT-compatible license for commercial safety, avoiding the AGPL license of `@imgly/background-removal`.

## Technology Stack Update
- **Runtime/Package Manager**: Bun
- **Background Removal**: Transformers.js + BiRefNet (MIT)
- **Framework**: Astro + React

## Plan
1. Switch package management to `bun`.
2. Install `@imgly/background-removal` using `bun`.
3. Refactor `background-removal-worker.ts` to use the new library.
4. Update `BackgroundRemover.tsx` to handle the new worker interface if necessary.
5. Verify performance and edge-case handling.
