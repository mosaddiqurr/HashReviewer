import type { HashState } from "../hashing/useFileHasher";

export function HashProgress({ state, onCancel }: { state: HashState; onCancel: () => void }) {
  if (state.status === "error") return <p className="error-message" role="alert">Could not read this file.</p>;
  if (state.status === "cancelled") return <p className="muted" role="status">Hashing cancelled. Choose a file to start again.</p>;
  if (state.status !== "hashing") return null;
  return <div className="hash-progress"><div><span role="status">Calculating hashes… {state.progress}%</span><button className="text-button" onClick={onCancel}>Cancel</button></div><progress aria-label="Hashing progress" value={state.progress} max={100} /></div>;
}
