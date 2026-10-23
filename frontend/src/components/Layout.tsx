import { useEffect, useRef, useState } from "react";
import { LazyMotion, MotionConfig, domAnimation, m } from "motion/react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon } from "./Icon";

const navigation = [
  { path: "/", label: "Home" },
  { path: "/verify", label: "Verify" },
  { path: "/compare", label: "Compare" },
  { path: "/about", label: "About" },
];

export function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#1b1816" : "#f5f3ed");
  }, [theme]);
  useEffect(() => {
    const name = navigation.find((item) => item.path === pathname)?.label ?? "Page not found";
    document.title = `${name} · HashReviewer`;
    if (previousPath.current !== pathname) {
      mainRef.current?.focus();
      window.scrollTo(0, 0);
      previousPath.current = pathname;
    }
  }, [pathname]);
  return <LazyMotion features={domAnimation} strict><MotionConfig reducedMotion="user">
    <div className="app-shell">
      <div className="paper-grid" aria-hidden="true" />
      <header className="site-header">
        <div className="navigation-wrap">
          <NavLink to="/" className="brand" aria-label="HashReviewer home">
            <span className="brand-symbol"><Icon name="hash" /></span>
            <span>HashReviewer</span>
          </NavLink>
          <nav aria-label="Primary navigation">
            {navigation.map(({ path, label }) => <NavLink key={path} to={path} end>{label}</NavLink>)}
          </nav>
          <div className="header-controls">
            <button className="icon-button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}><Icon name={theme === "dark" ? "sun" : "moon"} /></button>
          </div>
        </div>
      </header>
      <main ref={mainRef} tabIndex={-1} id="main-content">
        <m.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}><Outlet /></m.div>
      </main>
      <footer className="workspace-footer">
        <NavLink to="/" className="footer-brand"><Icon name="hash" />HashReviewer</NavLink>
      </footer>
    </div>
  </MotionConfig></LazyMotion>;
}
