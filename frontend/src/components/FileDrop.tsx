import { useId, useState } from "react";
import { Icon } from "./Icon";
import { formatBytes } from "../utilities/format";

interface Props {
  label: string;
  hint?: string;
  file: File | null;
  onSelect: (file: File) => void;
  accept?: string;
  compact?: boolean;
}

export function FileDrop({ label, hint = "Any file type. Read locally in your browser.", file, onSelect, accept, compact }: Props) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  return (
    <div className={`file-drop ${compact ? "file-drop--compact" : ""} ${dragging ? "is-dragging" : ""}`}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={(event) => { event.preventDefault(); setDragging(false); const selected = event.dataTransfer.files[0]; if (selected) onSelect(selected); }}>
      <input id={id} type="file" aria-label={label} aria-describedby={`${id}-hint`} accept={accept}
        onChange={(event) => { const selected = event.target.files?.[0]; if (selected) onSelect(selected); event.target.value = ""; }} />
      <label htmlFor={id}>
        <span className="drop-icon"><Icon name={file ? "file" : "upload"} /></span>
        <strong>{file ? file.name : label}</strong>
        <span id={`${id}-hint`}>{file ? `${formatBytes(file.size)} · Choose a different file` : hint}</span>
        {!file && <span className="browse-label">Choose file <Icon name="arrow" /></span>}
      </label>
    </div>
  );
}
