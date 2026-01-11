# Unbgly - Project Notes

This file contains notes and instructions for the Gemini agent working on this project.

## Current State: Rebranded and Feature Rich
The project has been rebranded from PureBG to **Unbgly**. It features a modern design, background image removal, custom background replacement, and real-time background filters.

## Technology Stack
- **Runtime/Package Manager**: Bun
- **Background Removal**: Transformers.js (MIT) - `onnx-community/BiRefNet_lite-ONNX`
- **Framework**: Astro + React
- **Styling**: Tailwind CSS v4 (Canonical classes)
- **State Management**: Zustand v5

## Milestones Passed
- [x] Switch to Transformers.js for MIT compliance.
- [x] Implement Zustand for editor state.
- [x] UI Modernization (OKLCH, Glassmorphism, Linear-inspired).
- [x] Integrated Interactive Before/After Slider.
- [x] Refined Zoom Precision.

## Next Steps
- [ ] Monitor for performance bottlenecks in edge cases.
- [ ] Explore additional AI models for specific image types (e.g., hair, sharp edges).

