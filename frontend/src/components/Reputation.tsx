import { useEffect, useRef, useState } from "react";
import { lookupReputation, reputationAvailable, type ReputationResult } from "../api/reputation";

export function Reputation({ sha256 }: { sha256: string }) {
  const [connection, setConnection] = useState<"checking" | "ready" | "unavailable">("checking");
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReputationResult | null>(null);
  const lookupController = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    void reputationAvailable(controller.signal).then((available) => {
      if (!controller.signal.aborted) setConnection(available ? "ready" : "unavailable");
    }).catch(() => { if (!controller.signal.aborted) setConnection("unavailable"); }).finally(() => window.clearTimeout(timeout));
    const onAbort = () => setConnection("unavailable");
    controller.signal.addEventListener("abort", onAbort, { once: true });
    return () => { controller.signal.removeEventListener("abort", onAbort); controller.abort(); window.clearTimeout(timeout); lookupController.current?.abort(); lookupController.current = null; };
  }, [attempt]);
  async function lookup() {
    if (pending) return;
    const controller = new AbortController();
    lookupController.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setPending(true); setError(""); setResult(null);
    try { const data = await lookupReputation(sha256, controller.signal); if (lookupController.current === controller) setResult(data); }
    catch { if (lookupController.current === controller) setError("Reputation lookup is unavailable."); }
    finally { window.clearTimeout(timeout); if (lookupController.current === controller) { setPending(false); lookupController.current = null; } }
  }
  return <section className="panel reputation-panel">
    <div className="section-heading"><div><h2>Reputation <span className="optional-label">Optional</span></h2><p>Review what VirusTotal knows about this fingerprint.</p></div><span className="provider-label">VirusTotal</span></div>
    <p className="small-note">Only the file hash is queried. The file itself is not uploaded.</p>
    {connection === "unavailable" ? <div className="unavailable-row"><p role="status">Reputation lookup is unavailable.</p><button className="text-button" onClick={() => { setConnection("checking"); setAttempt((value) => value + 1); }}>Retry connection</button></div> : <button className="button button--secondary" disabled={connection !== "ready" || pending} onClick={() => void lookup()}>{pending ? "Checking reputation…" : connection === "checking" ? "Connecting…" : "Check reputation"}</button>}
    {error && <p className="error-message" role="alert">{error}</p>}
    {result && <div className="reputation-result" aria-live="polite">
      {result.stats && <dl className="reputation-counts"><div><dt>Malicious detections</dt><dd>{result.stats.malicious}</dd></div><div><dt>Suspicious</dt><dd>{result.stats.suspicious}</dd></div><div><dt>Undetected</dt><dd>{result.stats.undetected}</dd></div></dl>}
      <h3 className={result.verdict === "Suspicious" ? "verdict-flagged" : ""}>{result.verdict}</h3><strong className="why-label">Why this result?</strong><p>{result.explanation}</p>
      {result.analyzedAt && <p className="small-note">Provider’s last analysis: {new Date(result.analyzedAt).toLocaleString()}</p>}
      <a className="text-link" href={`https://www.virustotal.com/gui/file/${sha256}`} target="_blank" rel="noopener noreferrer">View VirusTotal report ↗</a>
    </div>}
  </section>;
}
