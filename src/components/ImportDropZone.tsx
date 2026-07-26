import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { motion } from "framer-motion";
import { UploadCloud } from "lucide-react";
import { pickAndReadCsv } from "../lib/file";

interface ImportDropZoneProps {
  disabled?: boolean;
  onFilePicked: (fileName: string, text: string) => void;
  onError: (message: string) => void;
}

// Supports both drag-and-drop and the native file dialog. With
// dragDropEnabled: true (tauri.conf.json — needed elsewhere for the window's
// own native drag-drop), WebView2 intercepts OS-level file drags before the
// DOM ever sees them, so dataTransfer.files in a plain onDrop handler always
// comes back empty. Tauri's own onDragDropEvent is the only way to observe
// the drop under that setting — it's window-scoped (not element-scoped), so
// this hit-tests the event's position against the zone's own bounding rect
// to ignore drops elsewhere in the window, and reads the dropped path's
// content via the same read_text_file command the file-picker path already
// uses (a native drag-drop payload is a file path, not a File object).
export function ImportDropZone({ disabled, onFilePicked, onError }: ImportDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const zoneRef = useRef<HTMLDivElement>(null);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    async function handleDroppedPath(path: string) {
      const fileName = path.split(/[\\/]/).pop() ?? "Import";
      if (!fileName.toLowerCase().endsWith(".csv")) {
        onError(`"${fileName}" isn't a CSV file`);
        return;
      }
      try {
        const text = await invoke<string>("read_text_file", { path });
        onFilePicked(fileName, text);
      } catch (e) {
        onError(e instanceof Error ? e.message : String(e));
      }
    }

    void (async () => {
      const win = getCurrentWindow();
      const scaleFactor = await win.scaleFactor();
      const unlistenFn = await win.onDragDropEvent((event) => {
        const zone = zoneRef.current;
        if (!zone) return;

        if (event.payload.type === "leave") {
          setDragOver(false);
          return;
        }

        const rect = zone.getBoundingClientRect();
        const logical = event.payload.position.toLogical(scaleFactor);
        const overZone =
          logical.x >= rect.left && logical.x <= rect.right && logical.y >= rect.top && logical.y <= rect.bottom;

        if (event.payload.type === "enter" || event.payload.type === "over") {
          setDragOver(!disabledRef.current && overZone);
          return;
        }

        // "drop"
        setDragOver(false);
        if (disabledRef.current || !overZone) return;
        const path = event.payload.paths[0];
        if (path) void handleDroppedPath(path);
      });

      if (cancelled) {
        unlistenFn();
      } else {
        unlisten = unlistenFn;
      }
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [onError, onFilePicked]);

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

  return (
    <motion.div
      ref={zoneRef}
      className={"import-drop-zone" + (dragOver ? " drag-over" : "") + (disabled ? " disabled" : "")}
      animate={{ scale: dragOver ? 1.02 : 1 }}
      transition={{ duration: 0.15 }}
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
