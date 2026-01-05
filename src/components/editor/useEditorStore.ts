import type { Area, Point } from "react-easy-crop";
import { create } from "zustand";

interface EditorState {
	// Image sources
	image: string;
	sourceImage: string | null;
	processedImageSource: string;

	// Crop/Transform
	crop: Point;
	zoom: number;
	aspect: number;
	rotation: number;
	flipX: boolean;
	flipY: boolean;
	bgColor: string;
	croppedAreaPixels: Area | null;

	// Cleanup/Refine Mode
	isCleanupMode: boolean;
	brushMode: "eraser" | "restore";
	brushSize: number;
	refineZoom: number;
	refinePan: { x: number; y: number };
	isSpacePressed: boolean;
	manualMaskCanvas: HTMLCanvasElement | null;
	maskUpdateCounter: number;
	isDrawing: boolean;
}

interface EditorActions {
	// Initialization
	initializeEditor: (image: string, sourceImage: string | null) => void;
	resetEditor: () => void;

	// Image processing
	setProcessedImageSource: (source: string) => void;
	setManualMaskCanvas: (canvas: HTMLCanvasElement | null) => void;
	incrementMaskCounter: () => void;

	// Crop/Transform actions
	setCrop: (crop: Point | ((p: Point) => Point)) => void;
	setZoom: (zoom: number | ((z: number) => number)) => void;

	setAspect: (aspect: number) => void;
	setRotation: (rotation: number | ((r: number) => number)) => void;
	setFlipX: (flip: boolean) => void;
	setFlipY: (flip: boolean) => void;
	setBgColor: (color: string) => void;
	setCroppedAreaPixels: (area: Area | null) => void;

	// Cleanup mode actions
	setIsCleanupMode: (mode: boolean) => void;
	setBrushMode: (mode: "eraser" | "restore") => void;
	setBrushSize: (size: number) => void;
	setRefineZoom: (zoom: number | ((z: number) => number)) => void;
	setRefinePan: (
		pan:
			| { x: number; y: number }
			| ((p: { x: number; y: number }) => { x: number; y: number }),
	) => void;
	setIsSpacePressed: (pressed: boolean) => void;
	setIsDrawing: (drawing: boolean) => void;

	// Mask operations
	clearMask: () => void;
	drawOnMask: (x: number, y: number, isStart?: boolean) => void;
}

type EditorStore = EditorState & EditorActions;

const initialState: EditorState = {
	image: "",
	sourceImage: null,
	processedImageSource: "",
	crop: { x: 0, y: 0 },
	zoom: 1,
	aspect: 4 / 3,
	rotation: 0,
	flipX: false,
	flipY: false,
	bgColor: "transparent",
	croppedAreaPixels: null,
	isCleanupMode: false,
	brushMode: "eraser",
	brushSize: 30,
	refineZoom: 1,
	refinePan: { x: 0, y: 0 },
	isSpacePressed: false,
	manualMaskCanvas: null,
	maskUpdateCounter: 0,
	isDrawing: false,
};

export const useEditorStore = create<EditorStore>((set, get) => ({
	...initialState,

	// Initialization
	initializeEditor: (image, sourceImage) =>
		set({
			...initialState,
			image,
			sourceImage,
			processedImageSource: image,
		}),

	resetEditor: () => set(initialState),

	// Image processing
	setProcessedImageSource: (source) => set({ processedImageSource: source }),
	setManualMaskCanvas: (canvas) => set({ manualMaskCanvas: canvas }),
	incrementMaskCounter: () =>
		set((state) => ({ maskUpdateCounter: state.maskUpdateCounter + 1 })),

	// Crop/Transform
	setCrop: (crop) =>
		set((state) => ({
			crop: typeof crop === "function" ? crop(state.crop) : crop,
		})),
	setZoom: (zoom) =>
		set((state) => ({
			zoom:
				Math.round(
					(typeof zoom === "function" ? zoom(state.zoom) : zoom) * 100,
				) / 100,
		})),

	setAspect: (aspect) => set({ aspect }),
	setRotation: (rotation) =>
		set((state) => ({
			rotation:
				typeof rotation === "function" ? rotation(state.rotation) : rotation,
		})),
	setFlipX: (flip) => set({ flipX: flip }),
	setFlipY: (flip) => set({ flipY: flip }),
	setBgColor: (color) => set({ bgColor: color }),
	setCroppedAreaPixels: (area) => set({ croppedAreaPixels: area }),

	// Cleanup mode
	setIsCleanupMode: (mode) => set({ isCleanupMode: mode }),
	setBrushMode: (mode) => set({ brushMode: mode }),
	setBrushSize: (size) => set({ brushSize: size }),
	setRefineZoom: (zoom) =>
		set((state) => ({
			refineZoom:
				Math.round(
					(typeof zoom === "function" ? zoom(state.refineZoom) : zoom) * 100,
				) / 100,
		})),
	setRefinePan: (pan) =>
		set((state) => ({
			refinePan: typeof pan === "function" ? pan(state.refinePan) : pan,
		})),
	setIsSpacePressed: (pressed) => set({ isSpacePressed: pressed }),
	setIsDrawing: (drawing) => set({ isDrawing: drawing }),

	// Mask operations
	clearMask: () => {
		const { manualMaskCanvas } = get();
		if (!manualMaskCanvas) return;
		const ctx = manualMaskCanvas.getContext("2d");
		if (ctx) {
			ctx.clearRect(0, 0, manualMaskCanvas.width, manualMaskCanvas.height);
			set((state) => ({ maskUpdateCounter: state.maskUpdateCounter + 1 }));
		}
	},

	drawOnMask: (x, y, isStart = false) => {
		const { manualMaskCanvas, isCleanupMode, brushMode, brushSize } = get();
		if (!manualMaskCanvas || !isCleanupMode) return;
		const ctx = manualMaskCanvas.getContext("2d");
		if (!ctx) return;

		ctx.globalCompositeOperation = "source-over";
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.lineWidth = brushSize;
		ctx.strokeStyle =
			brushMode === "eraser" ? "rgba(255, 0, 0, 1)" : "rgba(0, 255, 0, 1)";

		if (isStart) {
			ctx.beginPath();
			ctx.moveTo(x, y);
		} else {
			ctx.lineTo(x, y);
			ctx.stroke();
		}
	},
}));
