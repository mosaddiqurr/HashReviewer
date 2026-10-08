import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FileDrop } from "../components/FileDrop";
import { HashProgress } from "../components/HashProgress";
import { Icon } from "../components/Icon";
import { useFileHasher } from "../hashing/useFileHasher";
import { MAX_RECEIPT_BYTES, parseReceipt, verifyReceipt, type IntegrityReceipt } from "../integrity/receipt";

export function VerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receipt, setReceipt] = useState<IntegrityReceipt | null>(null);
  const [receiptError, setReceiptError] = useState("");
  const [reading, setReading] = useState(false);
  const receiptTask = useRef(0);
  const { state, hashFile, cancel, reset } = useFileHasher(false);
  useEffect(() => () => { receiptTask.current++; }, []);
  async function selectReceipt(selected: File) {
    const task = ++receiptTask.current;
    setReceiptFile(selected); setReceipt(null); setReceiptError(""); setReading(true);
    try {
      if (selected.size > MAX_RECEIPT_BYTES) throw new Error("invalid");
      const parsed = parseReceipt(await selected.text());
      if (task === receiptTask.current) setReceipt(parsed);
    } catch { if (task === receiptTask.current) setReceiptError("The receipt is invalid."); }
    finally { if (task === receiptTask.current) setReading(false); }
  }
  const result = file && state.hashes && receipt ? verifyReceipt(file, state.hashes.sha256, receipt) : null;
  function clear() { receiptTask.current++; setFile(null); setReceiptFile(null); setReceipt(null); setReceiptError(""); setReading(false); reset(); }
  return <div className="page">
    <header className="page-header"><p className="eyebrow">The same file, confirmed</p><h1>Verify a receipt</h1><p>Choose a file and its integrity receipt. We’ll check whether the contents match.</p></header>
    <div className="two-columns"><section><h2 className="slot-heading"><span>01</span> Current file</h2><FileDrop compact label="File to verify" file={file} onSelect={(selected) => { setFile(selected); hashFile(selected); }} /><HashProgress state={state} onCancel={cancel} /></section><section><h2 className="slot-heading"><span>02</span> Integrity receipt</h2><FileDrop compact label="Integrity receipt" hint="Choose the .integrity.json receipt." file={receiptFile} onSelect={(selected) => void selectReceipt(selected)} accept=".json,application/json" />{reading && <p role="status" className="muted">Reading receipt…</p>}{receiptError && <p className="error-message" role="alert">{receiptError}</p>}</section></div>
    {result && file && receipt && state.hashes && <section className={`panel verification-result result--${result.verified ? "match" : "changed"}`} aria-live="polite">
      <div className="result-heading"><span className="result-icon"><Icon name={result.verified ? "check" : "different"} /></span><div><h2>{result.verified ? "VERIFIED" : "CHANGED"}</h2><p>{result.verified ? "File matches the receipt." : result.sha256Matches ? "The file size does not match the receipt." : "The current file does not match the recorded SHA-256."}</p></div></div>
      <div className="evidence-list">
        <div className="evidence-row"><strong>SHA-256</strong><span className={`evidence-status ${result.sha256Matches ? "" : "is-different"}`}>{result.sha256Matches ? "Matches" : "Different"}</span></div>
        <div className="hash-evidence"><div><span>Receipt SHA-256</span><code>{receipt.sha256}</code></div>{!result.sha256Matches && <div><span>Current SHA-256</span><code>{state.hashes.sha256}</code></div>}</div>
        <div className="evidence-row"><strong>Size</strong><span className={`evidence-status ${result.sizeMatches ? "" : "is-different"}`}>{result.sizeMatches ? "Matches" : "Different"}</span></div><p className="evidence-detail">Receipt: {receipt.size.toLocaleString()} bytes · Current: {file.size.toLocaleString()} bytes</p>
        <div className="evidence-row"><strong>Filename</strong><span className={`evidence-status ${result.filenameMatches ? "" : "is-renamed"}`}>{result.filenameMatches ? "Matches" : "Renamed"}</span></div><p className="evidence-detail">Receipt: {receipt.filename} · Current: {file.name}</p>
      </div>
      {!result.filenameMatches && <p className="small-note">The filename changed. Content verification depends on SHA-256 and size.</p>}
      <p className="small-note">Recorded {new Date(receipt.createdAt).toLocaleString()}. This receipt is unsigned; verification assumes you trust the receipt.</p>
    </section>}
    {!result && !receiptError && <div className="empty-note"><Icon name="receipt" /><p>Your result appears when both files are ready.</p></div>}
    <div className="page-bottom"><p>Need a receipt? <Link to="/check">Check a file</Link> to create one.</p>{(file || receiptFile) && <button className="text-button" onClick={clear}>Clear both files</button>}</div>
  </div>;
}
