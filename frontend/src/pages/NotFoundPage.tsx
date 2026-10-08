import { Link } from "react-router-dom";

export function NotFoundPage() { return <div className="page"><header className="page-header"><p className="eyebrow">Page not found</p><h1>Let’s check a file.</h1><p>This page isn’t available. Start a file check or return home.</p></header><Link className="button button--primary" to="/check">Check a file</Link><Link className="text-link" to="/">Home</Link></div>; }
