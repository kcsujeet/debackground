export const DONATION_LINK = "https://ko-fi.com/kcsujeet";
export const CONTACT_EMAIL = "ilamy.dev@gmail.com";

/**
 * General-purpose dichotomous segmentation model, MIT licensed. Unlike a portrait
 * matting model it handles products, objects, animals and plants as well as people.
 *
 * This is the 512x512 BiRefNet_lite export rather than the 1024x1024 one. At 1024
 * the CPU backend dies with `std::bad_alloc` partway through inference, and no
 * quantized BiRefNet build exists anywhere on the Hub to shrink it — only fp32 and
 * fp16. Quartering the input area is what makes the model fit, at the cost of
 * softer fine edges such as hair and fur.
 *
 * The repo ships `model.onnx` (192 MB, fp32) and `model_fp16.onnx` (98 MB).
 * @see https://huggingface.co/studioludens/birefnet-lite-512
 */
export const BACKGROUND_REMOVAL_MODEL_ID = "studioludens/birefnet-lite-512";

/**
 * BEN2 Base, MIT licensed. Noticeably better than BiRefNet_lite on non-human
 * subjects, and tried first wherever the device can take it.
 *
 * It only ships as fp16 (219 MB) at a fixed 1024x1024 input, so it needs WebGPU
 * with `shader-f16`. The CPU is out of reach: a native run peaked at 3.4 GB of
 * memory, far beyond what a mobile browser tab is given.
 * @see https://huggingface.co/onnx-community/BEN2-ONNX
 */
export const ENHANCED_BACKGROUND_REMOVAL_MODEL_ID = "onnx-community/BEN2-ONNX";
