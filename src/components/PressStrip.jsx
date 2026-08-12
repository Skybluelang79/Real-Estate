const BRANDS = ['Forbes', 'Bloomberg', 'Architectural Digest', 'The Wall Street Journal', 'Mansion Global', 'Luxe'];

export default function PressStrip() {
  return (
    <section className="press-strip" aria-label="As featured in">
      <div className="container">
        <span className="press-label">As Featured In</span>
        <div className="press-brands">
          {BRANDS.map((b) => (
            <span key={b} className="press-brand">{b}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
