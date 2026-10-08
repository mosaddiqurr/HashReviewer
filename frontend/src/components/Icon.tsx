export type IconName = "home" | "file" | "receipt" | "compare" | "info" | "lock" | "arrow" | "upload" | "check" | "different" | "copy" | "download";

const paths: Record<IconName, React.ReactNode> = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><path d="M9 21v-8h6v8" /></>,
  file: <><path d="M14 2H5a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>,
  receipt: <><path d="M5 3h14v19l-3-2-4 2-4-2-3 2Z" /><path d="M8 7h8M8 11h8m-7 5 2 2 4-4" /></>,
  compare: <path d="M3 7h16m-4-4 4 4-4 4M21 17H5m4-4-4 4 4 4" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  upload: <path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5" />,
  check: <path d="m5 12 4 4L19 6" />,
  different: <path d="m7 7 10 10M17 7 7 17" />,
  copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></>,
  download: <path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4" />,
};

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return <svg className={`icon ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
