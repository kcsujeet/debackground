import {
	Download,
	Loader2,
	Maximize,
	Trash2,
	Upload,
	X,
	Zap,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import BeforeAfterSlider from "./BeforeAfterSlider";
import ImageEditor from "./ImageEditor";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from "./ui/Card";
import { Dialog, DialogContent } from "./ui/dialog";

export default function BackgroundRemover() {
	const [image, setImage] = useState<string | null>(null);
	const [processedImage, setProcessedImage] = useState<string | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [status, setStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showEditor, setShowEditor] = useState(false);
	const workerRef = useRef<Worker | null>(null);

	useEffect(() => {
		workerRef.current = new Worker(
			new URL("../workers/background-removal-worker.ts", import.meta.url),
			{ type: "module" },
		);

		workerRef.current.onmessage = (event) => {
			const { status: workerStatus, message, processedImageUrl } = event.data;

			if (workerStatus === "loading" || workerStatus === "processing") {
				setStatus(message);
			} else if (workerStatus === "ready") {
				setStatus(null);
			} else if (workerStatus === "complete") {
				setProcessedImage(processedImageUrl);
				setIsProcessing(false);
				setStatus(null);
			} else if (workerStatus === "error") {
				setError(message);
				setIsProcessing(false);
				setStatus(null);
			}
		};

		return () => {
			workerRef.current?.terminate();
		};
	}, []);

	const handleUpload = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			const url = URL.createObjectURL(file);
			setImage(url);
			setProcessedImage(null);
			setError(null);
			setIsProcessing(true);

			if (workerRef.current) {
				workerRef.current.postMessage({
					action: "process",
					imageData: url,
				});
			} else {
				setError("Worker not initialized. Please refresh the page.");
				setIsProcessing(false);
			}
		},
		[],
	);

	const reset = () => {
		setImage(null);
		setProcessedImage(null);
		setError(null);
		setStatus(null);
	};

	const download = () => {
		if (!processedImage) return;
		const link = document.createElement("a");
		link.href = processedImage;
		link.download = "no-bg-image.png";
		link.click();
	};

	return (
		<div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12">
			{!image ? (
				<div className="flex flex-col items-center">
					<label className="relative group w-full max-w-2xl aspect-video flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-4xl cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all duration-300 bg-surface/30 backdrop-blur-xl shadow-2xl overflow-hidden">
						<div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

						<div className="relative flex flex-col items-center text-center p-8">
							<div className="p-6 bg-primary/10 rounded-lg group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500 mb-6">
								<Upload className="w-12 h-12 text-primary" />
							</div>
							<h3 className="text-2xl font-bold text-foreground mb-2">
								Drop your image here
							</h3>
							<p className="text-muted-foreground max-w-xs leading-relaxed text-sm">
								Transparent background in seconds. Processing is 100% local and
								private.
							</p>
						</div>
						<input
							type="file"
							className="sr-only"
							onChange={handleUpload}
							accept="image/*"
						/>
					</label>

					<div className="mt-12 flex items-center gap-8 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
						<span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
							Powered by
						</span>
						<div className="flex items-center gap-2 font-black text-xl text-foreground">
							<Zap className="w-6 h-6 fill-primary text-primary" />
							<span>Transformers.js</span>
						</div>
					</div>
				</div>
			) : (
				<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
					<Card className="rounded-xl overflow-hidden gap-0 pb-0">
						<CardHeader className="border-b">
							<CardTitle>
								{!isProcessing && processedImage && (
									<div className="flex items-center gap-4">
										<Badge
											variant="secondary"
											className="bg-primary/20 text-primary border-primary/20 font-bold uppercase tracking-wider text-[10px]"
										>
											Result
										</Badge>
										<span className="text-sm font-medium text-muted-foreground">
											Drag slider to compare
										</span>
									</div>
								)}
							</CardTitle>
							<CardAction>
								<div className="flex items-center gap-2">
									{isProcessing ? (
										<Badge variant="secondary" className="animate-pulse">
											Processing
										</Badge>
									) : (
										<>
											<Button
												variant="ghost"
												size="sm"
												onClick={reset}
												title="Discard"
											>
												<Trash2 className="w-4 h-4 text-muted-foreground" />
											</Button>
											{processedImage && (
												<>
													<Button
														variant="secondary"
														size="sm"
														onClick={() => setShowEditor(true)}
													>
														<Maximize className="w-4 h-4" />
														Edit & Refine
													</Button>
													<Button
														variant="default"
														size="sm"
														onClick={download}
														className="shadow-lg shadow-primary/20"
													>
														<Download className="w-4 h-4" />
														Download
													</Button>
												</>
											)}
										</>
									)}
								</div>
							</CardAction>
						</CardHeader>
						<CardContent className="p-0">
							<div className="relative w-full h-[500px] md:h-[600px] max-h-[70vh] bg-card flex items-center justify-center overflow-hidden">
								{/* Background comparison or initial state */}
								{image && !processedImage && !isProcessing && (
									<img
										src={image}
										alt="Original"
										className="max-w-full max-h-full object-contain"
									/>
								)}

								{/* Unified Comparison Slider */}
								{image && processedImage && !isProcessing && (
									<BeforeAfterSlider
										beforeImage={image}
										afterImage={processedImage}
									/>
								)}

								{/* Loading State */}
								{isProcessing && (
									<div className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-20 text-center p-8">
										<div className="relative mb-6">
											<div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
											<Loader2 className="w-12 h-12 text-primary animate-spin relative" />
										</div>
										<h4 className="text-lg font-bold text-foreground mb-1">
											{status || "Almost there..."}
										</h4>
										<p className="text-sm text-muted-foreground max-w-[200px]">
											Processing locally in your browser
										</p>
									</div>
								)}

								{/* Error State */}
								{error && (
									<div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-8 text-center">
										<div className="p-4 bg-rose-500/10 rounded-2xl mb-4 border border-rose-500/20">
											<X className="w-8 h-8 text-rose-500" />
										</div>
										<h4 className="text-lg font-bold text-rose-500 mb-2">
											Processing Error
										</h4>
										<p className="text-muted-foreground text-sm mb-6 max-w-xs">
											{error}
										</p>
										<Button
											variant="default"
											size="sm"
											onClick={() => {
												if (image && workerRef.current) {
													setError(null);
													setIsProcessing(true);
													workerRef.current.postMessage({
														action: "process",
														imageData: image,
													});
												}
											}}
										>
											Retry Processing
										</Button>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			<Dialog
				open={showEditor && !!processedImage}
				onOpenChange={(open) => !open && setShowEditor(false)}
			>
				<DialogContent
					className="min-w-[95vw] h-[90vh] p-0 rounded"
					showCloseButton={false}
				>
					{processedImage && (
						<ImageEditor
							image={processedImage}
							sourceImage={processedImage}
							onSave={(url: string) => {
								setProcessedImage(url);
								setShowEditor(false);
							}}
							onCancel={() => setShowEditor(false)}
						/>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
