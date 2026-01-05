# Gemini Project Notes

This file contains notes and instructions for the Gemini agent working on this project.

## Current State: UI Modernized & Interactive Demo Integrated
The project has successfully transitioned to a modern, Linear-inspired design. The interactive `BeforeAfterSlider` is integrated both in the hero section and the main background removal tool. Performance and zoom precision issues have been addressed.

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

