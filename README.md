# deBackground 🚀

**deBackground** is a professional-grade, 100% private, and free AI background remover that runs entirely in your browser. No signups, no fees, and no data ever leaves your device.

**Try it:** [debackground.pages.dev](https://debackground.pages.dev/)

![deBackground Hero](public/favicon.svg)

## ✨ Features

- **🛡️ 100% Private**: All AI processing happens locally in your browser using Transformers.js. Your photos are never uploaded to any server.
- **⚡ Browser-Native Performance**: Built with Astro, using WebGPU where available and falling back to WASM.
- **💎 Studio-Quality**: Advanced AI models handle complex edges like hair and transparent objects with precision.
- **🖼️ Anything, Not Just People**: General-purpose segmentation covers products, objects, animals and plants.
- **🔓 Unlimited & Free**: No daily quotas, no watermarks, and no hidden fees.
- **🎨 Custom Backgrounds**: Replace removed backgrounds with solid colors or your own images.

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Astro](https://astro.build/) + [React](https://reactjs.org/)
- **AI Engine**: [Transformers.js](https://huggingface.co/docs/transformers.js/) (MIT)
- **Models**: `onnx-community/BEN2-ONNX` on capable desktops, otherwise `studioludens/birefnet-lite-512`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)

## 🧠 The Model

deBackground tries [BEN2 Base](https://huggingface.co/PramaLLC/BEN2) (MIT) first, which
handles products, animals and plants noticeably better, and falls back to
[BiRefNet_lite](https://github.com/ZhengPeng7/BiRefNet) (MIT) at 512×512 everywhere BEN2
can't run. Either way the predicted mask is scaled back up to your image's resolution.

The weights download once and are cached by the browser. Which build you get depends on
your device:

| Backend | Weights | Notes |
| :--- | :--- | :--- |
| BEN2, WebGPU + fp16 | 219 MB | Desktop only. Needs `shader-f16`, and 8 GB of RAM where the browser reports it |
| BiRefNet_lite, WebGPU + fp16 | 98 MB | Desktop only. Requires a GPU adapter reporting `shader-f16` |
| WebGPU + fp32 | 192 MB | WebGPU adapters without fp16 support |
| WASM + fp32 | 192 MB | Phones and tablets, and the CPU fallback everywhere — noticeably slower |

Firefox ships WebGPU disabled by default; enable `dom.webgpu.enabled` in `about:config`
for the fast path. Desktop Safari support is partial. If a backend fails to load or run,
the worker moves down the table before reporting an error.

Phones and tablets skip WebGPU and run BiRefNet_lite on the CPU. On a Galaxy S22+ both
BEN2 and BiRefNet_lite killed the tab partway through WebGPU inference, and a killed tab
can't fall back to anything. Chrome reports at most 8 GB of memory, so `deviceMemory` alone
can't tell that phone from a desktop.

BEN2 has no CPU path: it only ships as fp16, and a native CPU run peaked at 3.4 GB.

If any GPU backend fails on a device, or the tab dies while it runs (browsers kill a tab
that runs out of memory rather than raising an error), that browser remembers it in
`localStorage` and skips that backend from then on. The CPU backend is never skipped,
since it's the last resort.

### Working resolution

Images are downscaled to at most **2048px on the longest edge** before processing, and
the result is produced at that size. Since the mask is predicted at 512×512 and scaled
up regardless, larger inputs sharpen only the colour channels while multiplying memory:
every pipeline stage holds another full-size buffer, and a 12 MP phone photo is enough
to exhaust a mobile browser's renderer and crash the tab.

### Why 512 and not 1024

The 1024×1024 export is more accurate on fine edges but does not run in a browser.
Its heaviest shader binds 11 storage buffers per stage while many GPU adapters cap at
10, and the CPU backend runs out of memory at that resolution. No quantized BiRefNet
build is published, so shrinking it that way isn't an option either. The worker logs
the adapter's reported limit and its chosen backend under `[background-removal]`.

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

4. Open [http://localhost:4324](http://localhost:4324) in your browser.

## 📖 Commands

| Command | Action |
| :--- | :--- |
| `bun dev` | Starts local dev server at `localhost:4324` |
| `bun run build` | Build your production site to `./dist/` |
| `bun run preview` | Preview your build locally |
| `bun run check` | Run Biome checks and formatting |
| `bun test` | Run the test suite |

## 🌐 Deployment

The site is deployed on Cloudflare Pages at
[debackground.pages.dev](https://debackground.pages.dev/), with a preview deployment for
every pull request. `public/_headers` sets the cross-origin isolation headers that
multi-threaded WASM needs.

## 🤝 Contributing

Issues and pull requests are welcome. Before opening a PR, run `bun run check` and
`bun test`. For a bug that only shows up on one device, open the page with `?debug=1`:
a Debug button shows the page and worker logs, keeps them across a crash, and can copy
them into the issue.

## 📄 License

[MIT](LICENSE) © 2026 Sujeet Kc. The models it downloads are MIT licensed too:
[BEN2 Base](https://huggingface.co/PramaLLC/BEN2) and
[BiRefNet](https://github.com/ZhengPeng7/BiRefNet).
