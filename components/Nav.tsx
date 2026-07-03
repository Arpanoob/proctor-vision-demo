import Link from "next/link";

export function Nav() {
  return (
    <nav className="nav">
      <div className="wrap nav-inner">
        <Link href="/" className="brand">
          <span className="brand-dot" aria-hidden />
          proctor-vision
        </Link>
        <div className="nav-links">
          <Link href="/docs" className="hide-sm">Docs</Link>
          <Link href="/demo">Demo</Link>
          <a href="https://github.com/Arpanoob/proctor-vision" target="_blank" rel="noreferrer" className="hide-sm">GitHub</a>
          <a href="https://www.npmjs.com/package/proctor-vision" target="_blank" rel="noreferrer" className="ver">v0.3.2</a>
        </div>
      </div>
    </nav>
  );
}
