import { m } from "motion/react";
import { Link } from "react-router-dom";
import { FileChecker } from "../components/FileChecker";
import { Icon } from "../components/Icon";

export function HomePage() {
  return <div className="home-page">
    <section className="landing-intro" aria-labelledby="home-title">
      <div className="intro-rule"><span>FILE INTEGRITY, WITHOUT THE UPLOAD.</span><span>YOUR DEVICE IS THE WORKSPACE.</span></div>
      <div className="landing-heading"><m.h1 id="home-title" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>Every byte.<br /><span>Accounted for.</span></m.h1><div className="landing-description"><p>A file can look the same. <br />Its fingerprint tells the full story.</p><p>Check it here. Save a receipt. <br />Know what you’re keeping.</p></div></div>
    </section>
    <m.div className="landing-checker" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.15 }}><FileChecker /></m.div>
    <section className="next-tools" aria-labelledby="next-tools-title"><div className="next-tools-intro"><span className="section-caption">GO A LITTLE FURTHER</span><h2 id="next-tools-title">Already have <br />something to check?</h2></div>
      <Link className="tool-link" to="/verify"><span className="tool-link-number">01</span><Icon name="receipt" /><div><h3>Verify a receipt</h3><p>Same file as before? <br />Check it against your saved reference.</p></div><Icon name="arrow" /></Link>
      <Link className="tool-link" to="/compare"><span className="tool-link-number">02</span><Icon name="compare" /><div><h3>Compare two files</h3><p>Different names. Same bytes? <br />Put their fingerprints side by side.</p></div><Icon name="arrow" /></Link>
    </section>
    <section className="privacy-section" aria-labelledby="privacy-title"><div className="privacy-statement"><Icon name="lock" /><h2 id="privacy-title">Your file.<br />Your business.</h2></div><div className="privacy-copy"><p>Hashing, receipts, and comparisons happen on your device. No file uploads and no saved history.</p><p>Reputation lookup is optional. Only the SHA-256 fingerprint is sent when you choose to check VirusTotal. A hash alone doesn’t establish safety.</p><Link className="text-link" to="/about">Read how HashReviewer works<Icon name="arrow" /></Link></div><div className="privacy-seal" aria-hidden="true"><Icon name="hash" /></div></section>
  </div>;
}
