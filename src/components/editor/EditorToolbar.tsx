import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EditorToolbarProps {
	onExit: () => void;
	onSave: () => void;
}

export default function EditorToolbar({ onExit, onSave }: EditorToolbarProps) {
	return (
		<div className="absolute top-6 left-6 right-6 flex items-center justify-end gap-3 z-50 pointer-events-none">
			<div className="flex gap-2 pointer-events-auto items-center">
				<Button
					variant="secondary"
					size="sm"
					type="button"
					className="bg-white/80 backdrop-blur-md border border-slate-200"
					onClick={onExit}
				>
					<X className="w-4 h-4" />
					Exit Editor
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
