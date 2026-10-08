import { useState } from "react";
import { Icon } from "./Icon";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(value); setMessage("Copied"); }
    catch { setMessage("Could not copy. Select the text to copy it."); }
  }
  return <span className="copy-action"><button className="button button--quiet" onClick={() => void copy()}><Icon name="copy" />{label}</button><span className="copy-message" role="status">{message}</span></span>;
}
