import {
	Eraser,
	FlipHorizontal,
	FlipVertical,
	Keyboard,
	Maximize,
	Paintbrush,
	Palette,
	RotateCw,
	Undo2,
	ZoomIn,
} from "lucide-react";
import Button from "../ui/Button";
import Slider from "../ui/Slider";
import { useEditorStore } from "./useEditorStore";

const BACKGROUND_COLORS = [
	"transparent",
	"#ffffff",
	"#000000",
	"#f8fafc", // Slate 50
	"#f1f5f9", // Slate 100
	"#e2e8f0", // Slate 200
	"#6366f1", // Indigo 500
	"#4f46e5", // Indigo 600
	"#06b6d4", // Cyan 500
	"#10b981", // Emerald 500
	"#f59e0b", // Amber 500
	"#ef4444", // Rose 500
];

export default function EditorSidebar() {
	const {
		isCleanupMode,
		setIsCleanupMode,
		brushMode,
		setBrushMode,
		brushSize,
		setBrushSize,
		refineZoom,
		setRefineZoom,
		clearMask,
		bgColor,
		setBgColor,
		setRotation,
		flipX,
		setFlipX,
		flipY,
		setFlipY,
		zoom,
		setZoom,
	} = useEditorStore();

	return (
		<div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 bg-white flex flex-col shrink-0">
			<div className="p-6 space-y-8 overflow-y-auto flex-1">
				{isCleanupMode ? (
					<div className="space-y-8 animate-in slide-in-from-right duration-300">
						<div>
							<h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
								Tool Type
							</h4>
							<div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-[1.25rem] border border-slate-100">
								<button
									type="button"
									onClick={() => setBrushMode("eraser")}
									className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${brushMode === "eraser" ? "bg-white shadow-md text-indigo-600 font-bold border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
								>
									<Eraser className="w-5 h-5" />
									<span className="text-[10px] uppercase tracking-wider">
										Eraser
									</span>
								</button>
								<button
									type="button"
									onClick={() => setBrushMode("restore")}
									className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${brushMode === "restore" ? "bg-white shadow-md text-emerald-600 font-bold border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}
								>
									<Undo2 className="w-5 h-5" />
									<span className="text-[10px] uppercase tracking-wider">
										Restore
									</span>
								</button>
							</div>
						</div>

						<Slider
							label="Brush Size"
							min={5}
							max={100}
							value={brushSize}
							onChange={setBrushSize}
							icon={<Paintbrush className="w-3 h-3" />}
						/>

						<Slider
							label="Zoom"
							min={0.5}
							max={3}
							step={0.1}
							value={refineZoom}
							onChange={setRefineZoom}
							icon={<ZoomIn className="w-3 h-3" />}
						/>

						<div className="pt-4 border-t border-slate-100">
							<Button
								variant="secondary"
								className="w-full bg-slate-50 border border-slate-100 text-slate-600"
								onClick={clearMask}
								icon={<RotateCw className="w-4 h-4" />}
							>
								Reset All Edits
							</Button>
						</div>

						<div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
							<p className="text-[10px] leading-relaxed text-amber-700 font-medium">
								Use the <strong>Eraser</strong> to remove leftover background
								and <strong>Restore</strong> to bring back accidentally removed
								details.
							</p>
						</div>

						<div className="pt-8">
							<Button
								variant="primary"
								className="w-full"
								onClick={() => setIsCleanupMode(false)}
							>
								Finish Refining
							</Button>
						</div>
					</div>
				) : (
					<div className="space-y-8 animate-in slide-in-from-left duration-300">
						<div>
							<h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
								<Palette className="w-3 h-3" /> Background
							</h4>
							<div className="flex flex-wrap gap-2.5">
								{BACKGROUND_COLORS.map((color) => (
									<button
										type="button"
										key={color}
										onClick={() => setBgColor(color)}
										className={`w-9 h-9 rounded-xl border-[3px] transition-all hover:scale-110 active:scale-95 ${bgColor === color ? "border-indigo-600 ring-4 ring-indigo-50" : "border-transparent shadow-sm"}`}
										style={{
											backgroundColor:
												color === "transparent" ? "white" : color,
											backgroundImage:
												color === "transparent"
													? "url('https://www.transparenttextures.com/patterns/checkerboard.png')"
													: "none",
										}}
									/>
								))}
								<div className="relative group">
									<button
										type="button"
										className={`w-9 h-9 rounded-xl border-[3px] transition-all hover:scale-110 active:scale-95 flex items-center justify-center bg-white ${!BACKGROUND_COLORS.includes(bgColor) && bgColor !== "transparent" ? "border-indigo-600 ring-4 ring-indigo-50" : "border-slate-100 shadow-sm"}`}
										style={{
											backgroundColor: !BACKGROUND_COLORS.includes(bgColor)
												? bgColor
												: "white",
										}}
										onClick={() =>
											document.getElementById("custom-color")?.click()
										}
									>
										<Palette
											className={`w-4 h-4 ${!BACKGROUND_COLORS.includes(bgColor) ? "text-white mix-blend-difference" : "text-slate-400"}`}
										/>
									</button>
									<input
										id="custom-color"
										type="color"
										value={
											BACKGROUND_COLORS.includes(bgColor) ? "#6366f1" : bgColor
										}
										onChange={(e) => setBgColor(e.target.value)}
										className="absolute inset-0 opacity-0 cursor-pointer"
									/>
								</div>
							</div>
						</div>

						<div>
							<h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
								<Maximize className="w-3 h-3" /> Transform
							</h4>
							<div className="grid grid-cols-3 gap-2">
								<Button
									variant="secondary"
									className="p-0 h-10"
									onClick={() => setRotation((r) => (r + 90) % 360)}
									title="Rotate"
								>
									<RotateCw className="w-4 h-4" />
								</Button>
								<Button
									variant="secondary"
									className={`p-0 h-10 ${flipX ? "bg-indigo-50 text-indigo-600 border-indigo-100" : ""}`}
									onClick={() => setFlipX(!flipX)}
								>
									<FlipHorizontal className="w-4 h-4" />
								</Button>
								<Button
									variant="secondary"
									className={`p-0 h-10 ${flipY ? "bg-indigo-50 text-indigo-600 border-indigo-100" : ""}`}
									onClick={() => setFlipY(!flipY)}
								>
									<FlipVertical className="w-4 h-4" />
								</Button>
							</div>
						</div>

						<Slider
							label="Zoom"
							min={1}
							max={3}
							step={0.1}
							value={zoom}
							onChange={setZoom}
							icon={<ZoomIn className="w-3 h-3" />}
						/>

						<div className="pt-4 border-t border-slate-100">
							<Button
								variant="outline"
								className="w-full h-14 rounded-2xl"
								icon={<Paintbrush className="w-5 h-5" />}
								onClick={() => setIsCleanupMode(true)}
							>
								Refine Edges
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Shortcuts Help Section */}
			<div className="p-6 bg-slate-50 border-t border-slate-200">
				<div className="flex items-center gap-2 mb-3">
					<Keyboard className="w-3.5 h-3.5 text-slate-500" />
					<h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
						Shortcuts
					</h4>
				</div>
				<div className="space-y-2.5">
					<div className="flex items-center justify-between text-[11px]">
						<span className="text-slate-600 font-medium">Pan View</span>
						<span className="font-mono bg-white px-2 py-0.5 rounded-md border border-slate-300 text-slate-950 shadow-xs font-bold">
							Space + Drag
						</span>
					</div>
					<div className="flex items-center justify-between text-[11px]">
						<span className="text-slate-600 font-medium">Zoom In/Out</span>
						<span className="font-mono bg-white px-2 py-0.5 rounded-md border border-slate-300 text-slate-950 shadow-xs font-bold">
							Alt + Wheel
						</span>
					</div>
					<div className="flex items-center justify-between text-[11px]">
						<span className="text-slate-600 font-medium">Natural Pan</span>
						<span className="font-mono bg-white px-2 py-0.5 rounded-md border border-slate-300 text-slate-950 shadow-xs font-bold">
							Mouse Wheel
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
