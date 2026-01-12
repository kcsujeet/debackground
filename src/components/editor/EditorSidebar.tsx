import {
	Contrast,
	Eraser,
	FlipHorizontal,
	FlipVertical,
	Image,
	Maximize,
	Monitor,
	Move,
	Paintbrush,
	Palette,
	RotateCw,
	Smartphone,
	Square,
	Sun,
	Undo2,
	X,
	ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { useEditorStore } from "./useEditorStore";

const BACKGROUND_COLORS = [
	{ value: "transparent", label: "None" },
	{ value: "#ffffff", label: "White" },
	{ value: "#000000", label: "Black" },
	{ value: "#fff1f2", label: "Mist" },
	{ value: "#eff6ff", label: "Sky" },
	{ value: "#f0fdf4", label: "Honeydew" },
	{ value: "#fffbeb", label: "Ivory" },
	{ value: "#faf5ff", label: "Lavender" },
	{ value: "#ecfeff", label: "Cyan" },
	{ value: "#ecfdf5", label: "Mint" },
	{ value: "#fff7ed", label: "Peach" },
	{ value: "#fdf2f8", label: "Rose" },
];

interface EditorSidebarProps {
	isOpen?: boolean;
	onClose?: () => void;
}

export default function EditorSidebar({ isOpen, onClose }: EditorSidebarProps) {
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
		bgImage,
		setBgImage,
		filters,
		setFilter,
		resetFilters,
		setRotation,
		flipX,
		setFlipX,
		flipY,
		setFlipY,
		zoom,
		setZoom,
		aspect,
		setAspect,
		imageAspect,
	} = useEditorStore();

	const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const url = URL.createObjectURL(file);
			setBgImage(url);
		}
	};

	return (
		<div
			className={`
			absolute md:relative inset-y-0 right-0 w-[280px] sm:w-80 h-full border-l border-border bg-background flex flex-col shrink-0 z-50 transition-transform duration-300 ease-in-out
			${isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
			${!isOpen ? "pointer-events-none md:pointer-events-auto" : "pointer-events-auto"}
		`}
		>
			{/* Mobile Close Button */}
			<div className="md:hidden p-4 border-b border-border flex items-center justify-between bg-muted/30">
				<span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
					Tools & Settings
				</span>
				<Button
					variant="ghost"
					size="sm"
					onClick={onClose}
					className="h-8 w-8 p-0 rounded-full"
				>
					<X className="w-4 h-4" />
				</Button>
			</div>
			<div className="p-6 space-y-8 overflow-y-auto flex-1 h-full">
				{isCleanupMode ? (
					<div className="space-y-8 animate-in slide-in-from-right duration-300">
						<div>
							<h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">
								Tool Type
							</h4>
							<div className="grid grid-cols-2 gap-2 bg-muted/50 p-1.5 rounded-2xl border border-border/50">
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

							<div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 mt-4">
								<p className="text-[10px] leading-relaxed text-amber-700 font-medium">
									Use the <strong>Eraser</strong> to remove leftover background
									and <strong>Restore</strong> to bring back accidentally
									removed details.
								</p>
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
							<div className="grid grid-cols-5 gap-y-5 gap-x-2">
								{BACKGROUND_COLORS.map((color) => (
									<div
										key={color.value}
										className="flex flex-col items-center gap-1.5 shrink-0"
									>
										<button
											type="button"
											onClick={() => setBgColor(color.value)}
											className={`w-9 h-9 rounded-xl border-[3px] transition-all cursor-pointer hover:scale-105 active:scale-95 ${bgColor === color.value ? "border-primary ring-4 ring-primary/10" : "border-border/50 shadow-sm"} ${color.value === "transparent" ? "bg-checkered" : ""}`}
											style={{
												backgroundColor:
													color.value === "transparent"
														? undefined
														: color.value,
											}}
										/>
										<span className="text-[9px] uppercase font-bold tracking-tighter text-muted-foreground truncate w-full text-center">
											{color.label}
										</span>
									</div>
								))}
								<div className="flex flex-col items-center gap-1.5 shrink-0 relative group">
									<button
										type="button"
										className={`w-9 h-9 rounded-xl border-[3px] transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center bg-card ${!BACKGROUND_COLORS.some((c) => c.value === bgColor) && bgColor !== "transparent" ? "border-primary ring-4 ring-primary/10" : "border-border shadow-sm"}`}
										style={{
											backgroundColor: !BACKGROUND_COLORS.some(
												(c) => c.value === bgColor,
											)
												? bgColor
												: "white",
										}}
										onClick={() =>
											document.getElementById("custom-color")?.click()
										}
									>
										<Palette
											className={`w-4 h-4 ${!BACKGROUND_COLORS.some((c) => c.value === bgColor) ? "text-primary-foreground mix-blend-difference" : "text-muted-foreground"}`}
										/>
									</button>
									<span className="text-[9px] uppercase font-bold tracking-tighter text-muted-foreground">
										Custom
									</span>
									<input
										id="custom-color"
										type="color"
										value={
											BACKGROUND_COLORS.some((c) => c.value === bgColor)
												? "#f1f5f9"
												: bgColor
										}
										onChange={(e) => setBgColor(e.target.value)}
										className="absolute inset-0 opacity-0 cursor-pointer"
									/>
								</div>
								{/* Upload Background Image */}
								<div className="flex flex-col items-center gap-1.5 shrink-0 relative">
									<button
										type="button"
										className={`w-9 h-9 rounded-xl border-[3px] transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center ${bgImage ? "border-primary ring-4 ring-primary/10" : "border-border shadow-sm"}`}
										onClick={() =>
											document.getElementById("bg-image-upload")?.click()
										}
										title="Upload background image"
										style={
											bgImage
												? {
														backgroundImage: `url(${bgImage})`,
														backgroundSize: "cover",
														backgroundPosition: "center",
													}
												: {}
										}
									>
										{!bgImage && (
											<Image className="w-4 h-4 text-muted-foreground" />
										)}
									</button>
									<span className="text-[9px] uppercase font-bold tracking-tighter text-muted-foreground">
										{bgImage ? "Image" : "Photo"}
									</span>
									<input
										id="bg-image-upload"
										type="file"
										accept="image/*"
										onChange={handleBgImageUpload}
										className="hidden"
									/>
								</div>
							</div>
						</div>

						{/* Background Filters Section */}
						<div>
							<div className="flex items-center justify-between mb-4">
								<h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
									<Contrast className="w-3 h-3" /> Bg Filters
								</h4>
								<Button
									variant="ghost"
									size="sm"
									className="h-6 px-2 text-xs"
									onClick={resetFilters}
								>
									<Undo2 className="w-3 h-3 mr-1" /> Reset
								</Button>
							</div>
							<div className="space-y-4">
								<div>
									<div className="flex items-center justify-between mb-2">
										<span className="text-xs text-muted-foreground flex items-center gap-1.5">
											<Sun className="w-3 h-3" /> Brightness
										</span>
										<span className="text-xs font-medium text-foreground">
											{filters.brightness}%
										</span>
									</div>
									<Slider
										value={[filters.brightness]}
										min={0}
										max={200}
										step={1}
										onValueChange={(v) => setFilter("brightness", v[0])}
									/>
								</div>
								<div>
									<div className="flex items-center justify-between mb-2">
										<span className="text-xs text-muted-foreground flex items-center gap-1.5">
											<Contrast className="w-3 h-3" /> Contrast
										</span>
										<span className="text-xs font-medium text-foreground">
											{filters.contrast}%
										</span>
									</div>
									<Slider
										value={[filters.contrast]}
										min={0}
										max={200}
										step={1}
										onValueChange={(v) => setFilter("contrast", v[0])}
									/>
								</div>
								<div>
									<div className="flex items-center justify-between mb-2">
										<span className="text-xs text-muted-foreground flex items-center gap-1.5">
											<Palette className="w-3 h-3" /> Saturation
										</span>
										<span className="text-xs font-medium text-foreground">
											{filters.saturation}%
										</span>
									</div>
									<Slider
										value={[filters.saturation]}
										min={0}
										max={200}
										step={1}
										onValueChange={(v) => setFilter("saturation", v[0])}
									/>
								</div>
								<div>
									<div className="flex items-center justify-between mb-2">
										<span className="text-xs text-muted-foreground flex items-center gap-1.5">
											<Move className="w-3 h-3" /> Blur
										</span>
										<span className="text-xs font-medium text-foreground">
											{filters.blur}px
										</span>
									</div>
									<Slider
										value={[filters.blur]}
										min={0}
										max={20}
										step={0.5}
										onValueChange={(v) => setFilter("blur", v[0])}
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
							<h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
								<Square className="w-3 h-3" /> Aspect Ratio
							</h4>
							<div className="grid grid-cols-3 gap-2">
								<Button
									variant="secondary"
									className={`h-auto py-2.5 flex-col gap-1 text-[10px] uppercase font-bold tracking-tight ${aspect === imageAspect ? "bg-primary/10 text-primary border-primary/20" : ""}`}
									onClick={() => setAspect(imageAspect)}
								>
									<Maximize className="w-3.5 h-3.5" />
									Original
								</Button>
								<Button
									variant="secondary"
									className={`h-auto py-2.5 flex-col gap-1 text-[10px] uppercase font-bold tracking-tight ${aspect === undefined ? "bg-primary/10 text-primary border-primary/20" : ""}`}
									onClick={() => setAspect(undefined)}
								>
									<Move className="w-3.5 h-3.5" />
									Free
								</Button>
								<Button
									variant="secondary"
									className={`h-auto py-2.5 flex-col gap-1 text-[10px] uppercase font-bold tracking-tight ${aspect === 1 ? "bg-primary/10 text-primary border-primary/20" : ""}`}
									onClick={() => setAspect(1)}
								>
									<Square className="w-3.5 h-3.5" />
									1:1
								</Button>
								<Button
									variant="secondary"
									className={`h-auto py-2.5 flex-col gap-1 text-[10px] uppercase font-bold tracking-tight ${aspect === 4 / 3 ? "bg-primary/10 text-primary border-primary/20" : ""}`}
									onClick={() => setAspect(4 / 3)}
								>
									<div className="w-4 h-3 border-2 border-current rounded-sm shrink-0" />
									4:3
								</Button>
								<Button
									variant="secondary"
									className={`h-auto py-2.5 flex-col gap-1 text-[10px] uppercase font-bold tracking-tight ${aspect === 16 / 9 ? "bg-primary/10 text-primary border-primary/20" : ""}`}
									onClick={() => setAspect(16 / 9)}
								>
									<Monitor className="w-3.5 h-3.5" />
									16:9
								</Button>
								<Button
									variant="secondary"
									className={`h-auto py-2.5 flex-col gap-1 text-[10px] uppercase font-bold tracking-tight ${aspect === 9 / 16 ? "bg-primary/10 text-primary border-primary/20" : ""}`}
									onClick={() => setAspect(9 / 16)}
								>
									<Smartphone className="w-3.5 h-3.5" />
									9:16
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
		</div>
	);
}
