import { Link } from "react-router-dom";

export function NotFoundPage() { return <div className="page"><header className="page-header"><p className="eyebrow">Page not found</p><h1>Let’s check a file.</h1><p>This page isn’t available. Check a file on Home.</p></header><Link className="button button--primary" to="/">Go to Home</Link></div>; }
