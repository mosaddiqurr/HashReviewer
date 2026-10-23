export function PageHeading({ title, children }: { title: string; children: React.ReactNode }) {
  return <header className="page-header">
    <h1>{title}</h1><p>{children}</p>
  </header>;
}
