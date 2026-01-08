import { Check, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EditorToolbarProps {
	onExit: () => void;
	onSave: () => void;
	onToggleSidebar: () => void;
}

export default function EditorToolbar({
	onExit,
	onSave,
	onToggleSidebar,
}: EditorToolbarProps) {
	return (
		<div className="absolute top-3 sm:top-6 left-3 sm:left-6 right-3 sm:right-6 flex items-center justify-end gap-2 sm:gap-3 z-50 pointer-events-none">
			<div className="flex gap-2 pointer-events-auto items-center">
				<Button
					variant="secondary"
					size="sm"
					type="button"
					className="bg-white/80 backdrop-blur-md border border-slate-200"
					onClick={onExit}
				>
					<X className="w-4 h-4" />
					<span className="hidden sm:inline">Exit Editor</span>
				</Button>

				<Button
					variant="secondary"
					size="sm"
					className="md:hidden bg-white/80 backdrop-blur-md border border-slate-200 h-10 w-10 p-0 rounded-full"
					onClick={onToggleSidebar}
					title="Tools & Settings"
				>
					<Settings className="w-5 h-5" />
				</Button>

				<Button
					variant="default"
					size="sm"
					onClick={onSave}
					className="shadow-lg shadow-primary/20"
				>
					<Check className="w-4 h-4" />
					Apply & Done
				</Button>
			</div>
		</div>
	);
}
