import { useState, type DragEvent } from "react";
import { motion } from "framer-motion";
import { UploadCloud } from "lucide-react";
import { pickAndReadCsv } from "../lib/file";

interface ImportDropZoneProps {
  disabled?: boolean;
  onFilePicked: (fileName: string, text: string) => void;
  onError: (message: string) => void;
}

// Supports both drag-and-drop and the native file dialog. The dialog's own
// filter already restricts to .csv, but a drag-and-drop can carry any file
// type, so that path validates the extension itself with a friendly message.
export function ImportDropZone({ disabled, onFilePicked, onError }: ImportDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);

  async function handleBrowse() {
    if (disabled) return;
    try {
      const picked = await pickAndReadCsv();
      if (!picked) return;
      const fileName = picked.path.split(/[\\/]/).pop() ?? "Import";
      onFilePicked(fileName, picked.text);
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      onError(`"${file.name}" isn't a CSV file`);
      return;
    }
    try {
      const text = await file.text();
      onFilePicked(file.name, text);
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <motion.div
      className={"import-drop-zone" + (dragOver ? " drag-over" : "") + (disabled ? " disabled" : "")}
      animate={{ scale: dragOver ? 1.02 : 1 }}
      transition={{ duration: 0.15 }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => void handleDrop(e)}
    >
      <UploadCloud size={32} />
      <p className="import-drop-zone-text">Drag a CSV file here</p>
      <span className="import-drop-zone-or">or</span>
      <button
        type="button"
        className="btn-primary"
        onClick={() => void handleBrowse()}
        disabled={disabled}
        title={disabled ? "Choose an account first" : undefined}
      >
        Browse files…
      </button>
    </motion.div>
  );
}
