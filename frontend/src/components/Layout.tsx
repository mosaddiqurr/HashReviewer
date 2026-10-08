import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon, type IconName } from "./Icon";

const navigation: { path: string; label: string; icon: IconName }[] = [
  { path: "/", label: "Home", icon: "home" },
  { path: "/check", label: "Check File", icon: "file" },
  { path: "/verify", label: "Verify", icon: "receipt" },
  { path: "/compare", label: "Compare", icon: "compare" },
  { path: "/about", label: "About", icon: "info" },
];

export function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);
  useEffect(() => {
    const name = navigation.find((item) => item.path === pathname)?.label ?? "Page not found";
    document.title = `${name} · HashReviewer`;
    if (previousPath.current !== pathname) {
      mainRef.current?.focus();
      window.scrollTo(0, 0);
      previousPath.current = pathname;
    }
  }, [pathname]);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand" aria-label="HashReviewer home">
          <img src="/logo-hash.png" width="42" height="42" alt="" />
          <span><strong>HashReviewer</strong><small>File integrity, made simple</small></span>
        </NavLink>
        <nav aria-label="Primary navigation">
          {navigation.map(({ path, label, icon }) => (
            <NavLink key={path} to={path} end><Icon name={icon} /><span>{label}</span></NavLink>
          ))}
        </nav>
        <div className="sidebar-note"><Icon name="lock" /><span>Your files stay<br />on your device.</span></div>
      </aside>
      <div className="workspace">
        <header className="workspace-bar"><span>FILE INTEGRITY &amp; HASH REPUTATION</span><span className="local-label"><span />Local first</span></header>
        <main ref={mainRef} tabIndex={-1} id="main-content"><Outlet /></main>
        <footer className="workspace-footer"><span>HashReviewer</span><span>A fingerprint. A clear answer.</span></footer>
      </div>
    </div>
  );
}
