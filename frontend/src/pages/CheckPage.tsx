import { useState } from "react";
import { Link } from "react-router-dom";
import { FileDrop } from "../components/FileDrop";
import { HashProgress } from "../components/HashProgress";
import { CopyButton } from "../components/CopyButton";
import { Icon } from "../components/Icon";
import { Reputation } from "../components/Reputation";
import { useFileHasher } from "../hashing/useFileHasher";
import { createReceipt, downloadReceipt } from "../integrity/receipt";
import { formatBytes } from "../utilities/format";

export function CheckPage() {
  const [file, setFile] = useState<File | null>(null);
  const [receiptMessage, setReceiptMessage] = useState("");
  const { state, hashFile, cancel, reset } = useFileHasher();
  const hashes = state.hashes;
  function selectFile(selected: File) { setFile(selected); setReceiptMessage(""); hashFile(selected); }
  function receipt() {
    if (!file || !hashes) return;
    try { downloadReceipt(createReceipt(file, hashes)); setReceiptMessage("Integrity receipt created."); }
    catch { setReceiptMessage("Could not download the receipt. Please try again."); }
  }
  return <div className="page">
    <header className="page-header"><p className="eyebrow">Start with a fingerprint</p><h1>Check a file</h1><p>Drop a file to calculate its hashes. It stays on your device.</p></header>
    <FileDrop label="Drop a file here" file={file} onSelect={selectFile} />
    <HashProgress state={state} onCancel={cancel} />
    {hashes && file && <div className="check-results">
      <section className="panel hashes-panel" aria-label="File hashes">
        <div className="section-heading"><div><h2>File fingerprint</h2><p className="file-meta">{file.name} <span>· {formatBytes(file.size)} ({file.size.toLocaleString()} bytes)</span></p></div><span className="badge">Calculated locally</span></div>
        <div className="primary-hash"><div className="hash-label"><span id="sha256-label">SHA-256</span><span>Recommended for integrity</span></div><code aria-labelledby="sha256-label" data-testid="sha256">{hashes.sha256}</code><CopyButton value={hashes.sha256} label="Copy SHA-256" /></div>
        <div className="legacy-hashes"><div><h3>SHA-1 <span className="legacy-label">Legacy</span></h3><code data-testid="sha1">{hashes.sha1}</code></div><div><h3>MD5 <span className="legacy-label">Legacy</span></h3><code data-testid="md5">{hashes.md5}</code></div></div>
        <p className="small-note">SHA-1 and MD5 are informational legacy hashes, not recommended for modern integrity guarantees.</p>
        <CopyButton value={`Filename: ${file.name}\nSize: ${file.size} bytes\nSHA-256: ${hashes.sha256}\nSHA-1: ${hashes.sha1}\nMD5: ${hashes.md5}`} label="Copy all hashes" />
      </section>
      <section className="panel receipt-panel"><div className="section-heading"><div><h2>Keep an integrity receipt</h2><p>Save this fingerprint. Verify the file against it later.</p></div><Icon name="receipt" /></div><div className="button-row"><button className="button button--primary" onClick={receipt}><Icon name="download" />Create integrity receipt</button><Link className="text-link" to="/verify">Verify a receipt<Icon name="arrow" /></Link></div><p className="small-note">A small JSON record. No file contents. Unsigned; keep it somewhere you trust.</p><span role="status" className="receipt-message">{receiptMessage}</span></section>
      <div className="integrity-line"><Icon name="info" /><span><strong>Integrity</strong> No receipt checked</span></div>
      <Reputation key={hashes.sha256} sha256={hashes.sha256} />
    </div>}
    {file && <button className="text-button clear-button" onClick={() => { setFile(null); setReceiptMessage(""); reset(); }}>Clear file</button>}
  </div>;
}
