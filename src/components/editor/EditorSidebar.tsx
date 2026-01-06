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
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
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
		<div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border bg-card flex flex-col shrink-0">
			<div className="p-6 space-y-8 overflow-y-auto flex-1">
				{isCleanupMode ? (
					<div className="space-y-8 animate-in slide-in-from-right duration-300">
						<div>
							<h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">
								Tool Type
							</h4>
							<div className="grid grid-cols-2 gap-2 bg-muted p-1.5 rounded-[1.25rem] border border-border">
								<button
									type="button"
									onClick={() => setBrushMode("eraser")}
									className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${brushMode === "eraser" ? "bg-card shadow-md text-primary font-bold border border-border" : "text-muted-foreground hover:text-foreground"}`}
								>
									<Eraser className="w-5 h-5" />
									<span className="text-[10px] uppercase tracking-wider">
										Eraser
									</span>
								</button>
								<button
									type="button"
									onClick={() => setBrushMode("restore")}
									className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${brushMode === "restore" ? "bg-card shadow-md text-emerald-600 font-bold border border-border" : "text-muted-foreground hover:text-foreground"}`}
								>
									<Undo2 className="w-5 h-5" />
									<span className="text-[10px] uppercase tracking-wider">
										Restore
									</span>
								</button>
							</div>
						</div>

						<div>
							<div className="flex items-center justify-between mb-3">
								<span className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
									<Paintbrush className="w-3 h-3" /> Brush Size
								</span>
								<span className="text-xs font-medium text-muted-foreground">
									{brushSize}px
								</span>
							</div>
							<Slider
								min={5}
								max={100}
								value={[brushSize]}
								onValueChange={(val) => setBrushSize(val[0])}
							/>
						</div>

						<div>
							<div className="flex items-center justify-between mb-3">
								<span className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
									<ZoomIn className="w-3 h-3" /> Zoom
								</span>
								<span className="text-xs font-medium text-muted-foreground">
									{refineZoom.toFixed(1)}x
								</span>
							</div>
							<Slider
								min={0.5}
								max={3}
								step={0.1}
								value={[refineZoom]}
								onValueChange={(val) => setRefineZoom(val[0])}
							/>
						</div>

						<div className="pt-4 border-t border-border">
							<Button
								variant="secondary"
								className="w-full"
								onClick={clearMask}
							>
								<RotateCw className="w-4 h-4" />
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
								variant="default"
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
							<h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
								<Palette className="w-3 h-3" /> Background
							</h4>
							<div className="flex flex-wrap gap-2.5">
								{BACKGROUND_COLORS.map((color) => (
									<button
										type="button"
										key={color}
										onClick={() => setBgColor(color)}
										className={`w-9 h-9 rounded-xl border-[3px] transition-all hover:scale-110 active:scale-95 ${bgColor === color ? "border-primary ring-4 ring-primary/10" : "border-transparent shadow-sm"} ${color === "transparent" ? "bg-checkered" : ""}`}
										style={{
											backgroundColor:
												color === "transparent" ? undefined : color,
										}}
									/>
								))}
								<div className="relative group">
									<button
										type="button"
										className={`w-9 h-9 rounded-xl border-[3px] transition-all hover:scale-110 active:scale-95 flex items-center justify-center bg-card ${!BACKGROUND_COLORS.includes(bgColor) && bgColor !== "transparent" ? "border-primary ring-4 ring-primary/10" : "border-border shadow-sm"}`}
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
											className={`w-4 h-4 ${!BACKGROUND_COLORS.includes(bgColor) ? "text-primary-foreground mix-blend-difference" : "text-muted-foreground"}`}
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
							<h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
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
									className={`p-0 h-10 ${flipX ? "bg-primary/10 text-primary border-primary/20" : ""}`}
									onClick={() => setFlipX(!flipX)}
								>
									<FlipHorizontal className="w-4 h-4" />
								</Button>
								<Button
									variant="secondary"
									className={`p-0 h-10 ${flipY ? "bg-primary/10 text-primary border-primary/20" : ""}`}
									onClick={() => setFlipY(!flipY)}
								>
									<FlipVertical className="w-4 h-4" />
								</Button>
							</div>
						</div>

						<div>
							<div className="flex items-center justify-between mb-3">
								<span className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
									<ZoomIn className="w-3 h-3" /> Zoom
								</span>
								<span className="text-xs font-medium text-muted-foreground">
									{zoom.toFixed(1)}x
								</span>
							</div>
							<Slider
								min={1}
								max={3}
								step={0.1}
								value={[zoom]}
								onValueChange={(val) => setZoom(val[0])}
							/>
						</div>

						<div className="pt-4 border-t border-border">
							<Button
								variant="outline"
								className="w-full h-14 rounded-2xl"
								onClick={() => setIsCleanupMode(true)}
							>
								<Paintbrush className="w-5 h-5" />
								Refine Edges
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Shortcuts Help Section */}
			<div className="p-6 bg-muted border-t border-border">
				<div className="flex items-center gap-2 mb-3">
					<Keyboard className="w-3.5 h-3.5 text-muted-foreground" />
					<h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
						Shortcuts
					</h4>
				</div>
				<div className="space-y-2.5">
					<div className="flex items-center justify-between text-[11px]">
						<span className="text-muted-foreground font-medium">Pan View</span>
						<span className="font-mono bg-card px-2 py-0.5 rounded-md border border-border text-foreground shadow-xs font-bold">
							Space + Drag
						</span>
					</div>
					<div className="flex items-center justify-between text-[11px]">
						<span className="text-muted-foreground font-medium">
							Zoom In/Out
						</span>
						<span className="font-mono bg-card px-2 py-0.5 rounded-md border border-border text-foreground shadow-xs font-bold">
							Alt + Wheel
						</span>
					</div>
					<div className="flex items-center justify-between text-[11px]">
						<span className="text-muted-foreground font-medium">
							Natural Pan
						</span>
						<span className="font-mono bg-card px-2 py-0.5 rounded-md border border-border text-foreground shadow-xs font-bold">
							Mouse Wheel
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
