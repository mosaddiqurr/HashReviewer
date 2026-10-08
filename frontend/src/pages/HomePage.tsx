import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";

export function HomePage() {
  return <div className="home-page">
    <div className="home-intro">
      <img className="home-logo" src="/logo-hash.png" alt="HashReviewer shield and fingerprint logo" width="112" height="112" />
      <p className="eyebrow">Confidence in every file</p>
      <h1>HashReviewer</h1>
      <p className="home-description">Verify file integrity and review hash reputation.</p>
      <p className="home-question">Is this the same file I expected, and is its fingerprint known to be suspicious?</p>
      <div className="home-actions">
        <Link className="button button--primary" to="/check"><Icon name="file" />Check a file<Icon name="arrow" /></Link>
        <Link className="button button--secondary" to="/verify"><Icon name="receipt" />Verify a receipt</Link>
      </div>
      <Link className="home-compare" to="/compare">Compare two files<Icon name="arrow" /></Link>
    </div>
    <div className="home-bottom"><Icon name="lock" /><p><strong>Your files stay with you.</strong><span>Hashes, receipts, and comparisons run in your browser.</span></p></div>
  </div>;
}
