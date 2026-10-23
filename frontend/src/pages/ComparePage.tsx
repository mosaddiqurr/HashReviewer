import { useState } from "react";
import { FileDrop } from "../components/FileDrop";
import { HashProgress } from "../components/HashProgress";
import { CopyButton } from "../components/CopyButton";
import { Icon } from "../components/Icon";
import { PageHeading } from "../components/PageHeading";
import { useFileHasher } from "../hashing/useFileHasher";
import { compareFiles } from "../integrity/receipt";
import { formatBytes } from "../utilities/format";

export function ComparePage() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const a = useFileHasher(false);
  const b = useFileHasher(false);
  const result = fileA && fileB && a.state.hashes && b.state.hashes ? compareFiles({ size: fileA.size, sha256: a.state.hashes.sha256 }, { size: fileB.size, sha256: b.state.hashes.sha256 }) : null;
  return <div className="page">
    <PageHeading title="Compare two files">Check whether two files contain the same bytes, even if their names differ.</PageHeading>
    <div className="two-columns"><section><h2 className="slot-heading"><span>A</span> First file</h2><FileDrop compact label="File A" file={fileA} onSelect={(selected) => { setFileA(selected); a.hashFile(selected); }} /><HashProgress state={a.state} onCancel={a.cancel} /></section><section><h2 className="slot-heading"><span>B</span> Second file</h2><FileDrop compact label="File B" file={fileB} onSelect={(selected) => { setFileB(selected); b.hashFile(selected); }} /><HashProgress state={b.state} onCancel={b.cancel} /></section></div>
    {result && fileA && fileB && a.state.hashes && b.state.hashes && <section className={`panel comparison-result result--${result.identical ? "match" : "changed"}`} aria-live="polite">
      <div className="result-heading"><span className="result-icon"><Icon name={result.identical ? "check" : "different"} /></span><div><h2>{result.identical ? "IDENTICAL" : "DIFFERENT"}</h2><p>{result.identical ? "Both files have the same SHA-256 and size." : "These files do not have the same fingerprint."}</p></div></div>
      <div className="comparison-hashes">{[{ label: "File A", file: fileA, hashes: a.state.hashes }, { label: "File B", file: fileB, hashes: b.state.hashes }].map(({ label, file, hashes }) => <div key={label}><h3>{label} <span>{formatBytes(file.size)}</span></h3><p>{file.name}</p><span className="hash-caption">SHA-256</span><code>{hashes.sha256}</code><CopyButton value={hashes.sha256} label={`Copy ${label} SHA-256`} /></div>)}</div>
      <p className="size-difference"><strong>Size difference</strong><span>{Math.abs(result.sizeDifference).toLocaleString()} bytes{result.sizeDifference ? ` · File B is ${result.sizeDifference > 0 ? "larger" : "smaller"}` : " · Same size"}</span></p>
    </section>}
    {!result && <div className="empty-note"><Icon name="compare" /><p>Your result appears when both files are ready.</p></div>}
    <div className="page-bottom"><p>Integrity comparison using SHA-256 and size. No binary diff.</p>{(fileA || fileB) && <button className="text-button" onClick={() => { setFileA(null); setFileB(null); a.reset(); b.reset(); }}>Clear both files</button>}</div>
  </div>;
}
