export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", padding: "40px 0", color: "var(--muted)", fontSize: 14 }}>
      <div className="wrap" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <span>
          proctor-vision — MIT licensed. All video stays in the browser.<br />
          <span style={{ opacity: .8 }}>Support: <a href="mailto:arpanguptaastro@gmail.com" style={{ color: "var(--iris)" }}>arpanguptaastro@gmail.com</a></span>
        </span>
        <span style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <a href="https://www.npmjs.com/package/proctor-vision" target="_blank" rel="noreferrer">npm</a>
          <a href="https://github.com/Arpanoob/proctor-vision" target="_blank" rel="noreferrer">GitHub</a>
          <a href="/docs">Docs</a>
        </span>
      </div>
    </footer>
  );
}
