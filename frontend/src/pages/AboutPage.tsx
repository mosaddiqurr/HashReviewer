export function AboutPage() {
  return <div className="page about-page">
    <header className="page-header about-header"><div><p className="eyebrow">A little clarity goes a long way</p><h1>About HashReviewer</h1><p>Verify file integrity and review hash reputation.</p></div></header>
    <div className="about-sections">
      <section><h2>A simple check for the file you expected.</h2><p>Calculate a file’s fingerprint, save an integrity receipt, verify it later, or compare two files. Optionally check whether VirusTotal has a reputation report for the fingerprint.</p></section>
      <section><h2>Your file stays on your device.</h2><p>Hash calculation, receipt creation, verification, and comparison happen in your browser. HashReviewer does not upload file contents or keep a history. An optional reputation lookup sends only SHA-256 to the configured backend and VirusTotal.</p><p className="small-note">A hash can identify a known file. The backend, provider, and hosting infrastructure may see the queried hash and network information. Downloaded receipts contain the filename and size; share them thoughtfully.</p></section>
      <section><h2>Integrity needs a trusted reference.</h2><p>SHA-256 helps confirm that file contents match a trusted receipt. Receipts are unsigned records, not cryptographic signatures or proof of who created a file. Someone who can replace both the file and receipt can defeat this check.</p><p>SHA-1 and MD5 are legacy identifiers. They are not recommended for modern integrity guarantees. A renamed file can still have matching contents.</p></section>
      <section><h2>Reputation is evidence, not certainty.</h2><p>A hash reputation match is evidence about a known fingerprint and does not prove every contextual claim about a file. An unknown fingerprint or no known detections does not establish safety; reports can be incomplete, stale, or contain false positives.</p></section>
    </div>
    <div className="author-credit"><span>Designed and built by</span><a href="https://www.linkedin.com/in/mosaddiqur/" target="_blank" rel="noopener noreferrer">Mosaddiqur Rahman ↗</a></div>
  </div>;
}
