import {
	Download,
	Heart,
	Loader2,
	Trash2,
	Upload,
	Wand2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { DONATION_LINK } from "@/lib/constants";
import {
	clearInterruptedAttempt,
	hasEnhancedModelFailed,
	markerStorage,
	recordModelAttempt,
	recordModelFailure,
	recordModelSuccess,
} from "@/lib/enhanced-model-memory";
import { toWorkingImage } from "@/lib/prepare-image";
import { formatMegabytes } from "@/lib/utils";
import type { DownloadProgress } from "@/workers/download-progress";
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
	const [modelDownload, setModelDownload] = useState<DownloadProgress | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);
	const [showEditor, setShowEditor] = useState(false);
	const [showDownloadDialog, setShowDownloadDialog] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const workerRef = useRef<Worker | null>(null);
	const objectUrlRef = useRef<string | null>(null);

	const postProcess = useCallback((imageData: Blob | string) => {
		workerRef.current?.postMessage({
			action: "process",
			imageData,
			enhancedModelFailed: hasEnhancedModelFailed(markerStorage()),
		});
	}, []);

	useEffect(() => {
		const storage = markerStorage();
		const onPageHide = () => clearInterruptedAttempt(storage);
		window.addEventListener("pagehide", onPageHide);

		workerRef.current = new Worker(
			new URL("../workers/background-removal-worker.ts", import.meta.url),
			{ type: "module" },
		);

		workerRef.current.onmessage = (event) => {
			const { status: workerStatus, message, processedImageUrl } = event.data;

			if (workerStatus === "attempt") {
				recordModelAttempt(storage, event.data.model);
			} else if (workerStatus === "attempt-failed") {
				recordModelFailure(storage, event.data.model);
			} else if (workerStatus === "downloading") {
				const { percent, loaded, total } = event.data;
				setStatus("Downloading AI model...");
				setModelDownload({ percent, loaded, total });
			} else if (workerStatus === "loading" || workerStatus === "processing") {
				setStatus(message);
				setModelDownload(null);
			} else if (workerStatus === "complete") {
				recordModelSuccess(storage, event.data.meta.model);
				setProcessedImage(processedImageUrl);
				setIsProcessing(false);
				setStatus(null);
				setModelDownload(null);
			} else if (workerStatus === "error") {
				setError(message);
				setIsProcessing(false);
				setStatus(null);
				setModelDownload(null);
			}
		};

		return () => {
			window.removeEventListener("pagehide", onPageHide);
			workerRef.current?.terminate();
			if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
		};
	}, []);

	const processFile = useCallback(
		async (file: File) => {
			setProcessedImage(null);
			setError(null);
			setIsProcessing(true);

			if (!workerRef.current) {
				setError("Worker not initialized. Please refresh the page.");
				setIsProcessing(false);
				return;
			}

			try {
				// Downscale before anything else holds a copy. A blob URL also avoids the
				// base64 data URL, which was retained in state and copied again to the worker.
				const working = await toWorkingImage(file);

				if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
				objectUrlRef.current = URL.createObjectURL(working);
				setImage(objectUrlRef.current);

				postProcess(working);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Could not read that image.",
				);
				setIsProcessing(false);
			}
		},
		[postProcess],
	);

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			if (acceptedFiles.length > 0) {
				processFile(acceptedFiles[0]);
			}
		},
		[processFile],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { "image/*": [] },
		multiple: false,
	});

	const reset = () => {
		if (objectUrlRef.current) {
			URL.revokeObjectURL(objectUrlRef.current);
			objectUrlRef.current = null;
		}
		setImage(null);
		setProcessedImage(null);
		setError(null);
		setStatus(null);
	};

	const download = async () => {
		if (!processedImage) return;

		setShowDownloadDialog(true);
		setIsExporting(true);

		// Simulate exporting process
		await new Promise((resolve) => setTimeout(resolve, 2000));

		const link = document.createElement("a");
		link.href = processedImage;
		link.download = "no-bg-image.png";
		link.click();

		setIsExporting(false);
	};

	return (
		<div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12">
			{!image ? (
				<div className="flex flex-col items-center">
					<div
						{...getRootProps()}
						className={`relative group w-full max-w-2xl min-h-[300px] md:aspect-video flex flex-col items-center justify-center border-2 border-dashed rounded-4xl cursor-pointer transition-all duration-300 overflow-hidden ${
							isDragActive
								? "border-primary bg-primary/10 ring-4 ring-primary/20"
								: "hover:border-primary/60 hover:bg-primary/5"
						}`}
					>
						<input {...getInputProps()} />
						<div
							className={`absolute inset-0 bg-linear-to-br from-indigo-500/5 to-transparent transition-opacity ${
								isDragActive
									? "opacity-100"
									: "opacity-0 group-hover:opacity-100"
							}`}
						/>

						<div className="relative flex flex-col items-center text-center p-6 md:p-8">
							<div className="p-4 md:p-6 bg-primary/10 rounded-lg group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500 mb-4 md:mb-6">
								<Upload className="w-8 h-8 md:w-12 md:h-12 text-primary" />
							</div>
							<h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
								{isDragActive
									? "Drop to remove background"
									: "Drop your image here"}
							</h3>
							<p className="text-muted-foreground max-w-[240px] md:max-w-xs leading-relaxed text-xs md:text-sm">
								Transparent background in seconds.
							</p>
						</div>
					</div>
				</div>
			) : (
				<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
					<Card className="rounded-3xl overflow-hidden gap-0 py-0 shadow-lg border-border/50">
						<CardHeader className="border-b flex flex-row items-center justify-between py-4! space-y-0">
							<CardTitle className="p-0">
								{!isProcessing && processedImage && (
									<div className="flex items-center gap-4">
										<Badge
											variant="secondary"
											className="bg-primary text-primary-foreground border-primary font-bold uppercase tracking-wider text-[10px]"
										>
											Result
										</Badge>
										<span className="text-sm font-medium text-muted-foreground hidden @[450px]/card-header:inline">
											Drag slider to compare
										</span>
									</div>
								)}
							</CardTitle>
							<CardAction className="self-center">
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
														<Wand2 className="w-4 h-4" />
														<span className="hidden @[600px]/card-header:inline">
															Edit & Refine
														</span>
													</Button>
													<Button
														variant="default"
														size="sm"
														onClick={download}
														className="shadow-primary/20 bg-primary"
													>
														<Download className="w-4 h-4" />
														<span className="hidden @[500px]/card-header:inline">
															Download
														</span>
													</Button>
												</>
											)}
										</>
									)}
								</div>
							</CardAction>
						</CardHeader>
						<CardContent className="p-0">
							<div className="relative w-full h-auto min-h-[400px] bg-card flex items-center justify-center overflow-hidden">
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
									<div className="absolute inset-0 bg-background flex flex-col items-center justify-center z-20 text-center p-8">
										<div className="relative mb-6">
											<div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
											<Loader2 className="w-12 h-12 text-primary animate-spin relative" />
										</div>
										<h4 className="text-lg font-bold text-foreground mb-1">
											{status || "Almost there..."}
										</h4>
										{!modelDownload && (
											<p className="text-sm text-muted-foreground max-w-[200px]">
												Processing locally in your browser
											</p>
										)}

										{modelDownload && (
											<div className="w-full max-w-[220px] mt-5">
												<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
													<div
														className="h-full rounded-full bg-primary transition-[width] duration-300"
														style={{ width: `${modelDownload.percent}%` }}
													/>
												</div>
												<p className="mt-2 text-xs text-muted-foreground tabular-nums">
													{formatMegabytes(modelDownload.loaded)} of{" "}
													{formatMegabytes(modelDownload.total)}
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													One-time download, cached for next time
												</p>
											</div>
										)}
									</div>
								)}

								{/* Error State */}
								{error && (
									<div className="absolute inset-0 bg-background flex flex-col items-center justify-center z-30 p-8 text-center">
										<div className="p-4 bg-rose-500 rounded-2xl mb-4 border border-rose-500">
											<X className="w-8 h-8 text-white" />
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
													postProcess(image);
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
					className="min-w-[95vw] h-[90dvh] p-0 rounded-3xl border-none overflow-hidden"
					showCloseButton={false}
				>
					{processedImage && (
						<ImageEditor
							image={processedImage}
							sourceImage={image}
							onSave={(url: string, sourceUrl?: string) => {
								setProcessedImage(url);
								if (sourceUrl) setImage(sourceUrl);
								setShowEditor(false);
							}}
							onCancel={() => setShowEditor(false)}
						/>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
				<DialogContent
					className="max-w-md p-6 md:p-8 text-center rounded-4xl border-primary/10"
					showCloseButton={false}
				>
					{isExporting ? (
						<div className="space-y-6 pt-4">
							<div className="relative w-fit mx-auto">
								<div className="absolute inset-0 bg-primary/10 blur-xl rounded-full animate-pulse" />
								<Loader2 className="w-16 h-16 text-primary animate-spin relative" />
							</div>
							<div className="space-y-2">
								<h3 className="text-xl font-bold text-foreground font-heading tracking-tight">
									Exporting your image...
								</h3>
								<p className="text-sm text-muted-foreground">
									Generating HD quality result locally.
								</p>
							</div>
						</div>
					) : (
						<div className="space-y-8 animate-in zoom-in-95 fade-in duration-500">
							<div className="space-y-4">
								<div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
									<Download className="w-10 h-10 text-white" />
								</div>
								<div className="space-y-2">
									<h3 className="text-2xl font-bold text-foreground font-heading tracking-tight">
										Your image is ready
									</h3>
									<p className="text-sm text-muted-foreground leading-relaxed">
										deBackground is a solo project built to provide free,
										private background removal for everyone. If this tool saved
										you some time, a small tip helps keep the servers running!
									</p>
								</div>
							</div>

							<div className="flex flex-col gap-3">
								<a
									href={DONATION_LINK}
									target="_blank"
									rel="noopener noreferrer"
									className="group relative flex items-center justify-center gap-3 w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-xl shadow-rose-500/20 overflow-hidden"
								>
									<div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
									<Heart className="w-5 h-5 fill-white animate-pulse" />
									<span>Support</span>
								</a>
								<Button
									variant="ghost"
									className="text-muted-foreground text-xs hover:text-foreground"
									onClick={() => setShowDownloadDialog(false)}
								>
									Maybe later
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
