# deBackground 🚀

**deBackground** is a professional-grade, 100% private, and free AI background remover that runs entirely in your browser. No signups, no fees, and no data ever leaves your device.

![deBackground Hero](public/favicon.svg)

## ✨ Features

- **🛡️ 100% Private**: All AI processing happens locally in your browser using Transformers.js. Your photos are never uploaded to any server.
- **⚡ Browser-Native Performance**: Built with Astro and high-performance WASM inference for instant results.
- **💎 Studio-Quality**: Advanced AI models handle complex edges like hair and transparent objects with precision.
- **🔓 Unlimited & Free**: No resolution limits, no daily quotas, and no hidden fees.
- **🎨 Custom Backgrounds**: Replace removed backgrounds with solid colors or your own images.

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Astro](https://astro.build/) + [React](https://reactjs.org/)
- **AI Engine**: [Transformers.js](https://huggingface.co/docs/transformers.js/) (MIT)
- **Model**: `onnx-community/BiRefNet_lite-ONNX`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)

## 🚀 Getting Started

### Prerequisites

Ensure you have [Bun](https://bun.sh/) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kcsujeet/debackground.git
   cd debackground
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun dev
   ```

4. Open [http://localhost:4321](http://localhost:4321) in your browser.

## 📖 Commands

| Command | Action |
| :--- | :--- |
| `bun dev` | Starts local dev server at `localhost:4321` |
| `bun run build` | Build your production site to `./dist/` |
| `bun run preview` | Preview your build locally |
| `bun run check` | Run Biome checks and formatting |


