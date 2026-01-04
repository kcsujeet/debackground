import { Check, X } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { useEditorStore } from "./useEditorStore";

interface EditorToolbarProps {
	onExit: () => void;
	onSave: () => void;
}

export default function EditorToolbar({ onExit, onSave }: EditorToolbarProps) {
	const { isCleanupMode } = useEditorStore();

	return (
		<div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10 pointer-events-none">
			<div className="flex items-center gap-3 pointer-events-auto">
				<Button
					variant="secondary"
					size="sm"
					type="button"
					className="bg-white/80 backdrop-blur-md border border-slate-200"
					onClick={onExit}
					icon={<X className="w-4 h-4" />}
				>
					Exit Editor
				</Button>
				<Badge variant={isCleanupMode ? "amber" : "indigo"}>
					{isCleanupMode ? "Refine Mode" : "Compose Mode"}
				</Badge>
			</div>

			<div className="flex gap-2 pointer-events-auto">
				<Button
					variant="primary"
					size="sm"
					icon={<Check className="w-4 h-4" />}
					onClick={onSave}
				>
					Apply & Done
				</Button>
			</div>
		</div>
	);
}
