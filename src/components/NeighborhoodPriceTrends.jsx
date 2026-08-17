import { Link } from 'react-router';
import { useLanguage } from '../context/LanguageCtx';
import neighborhoods from '../data/neighborhoods';

function parseAvg(priceStr) {
  const m = String(priceStr || '').match(/([\d.]+)([KM])/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return m[2].toUpperCase() === 'M' ? n * 1e6 : n * 1e3;
}

export default function NeighborhoodPriceTrends() {
  const { t } = useLanguage();
  const rows = neighborhoods
    .map((n) => ({ slug: n.slug, name: n.name, avg: parseAvg(n.stats?.avgPrice), label: n.stats?.avgPrice || '—' }))
    .sort((a, b) => b.avg - a.avg);
  const max = Math.max(...rows.map((r) => r.avg), 1);

  return (
    <section className="section trends-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('home.trends.title')}</h2>
          <p>{t('home.trends.subtitle')}</p>
        </div>
        <div className="trends-bars">
          {rows.map((r) => (
            <Link to={`/neighborhoods/${r.slug}`} className="trend-row" key={r.slug}>
              <span className="trend-name">{r.name}</span>
              <div className="trend-track">
                <div className="trend-fill" style={{ width: `${(r.avg / max) * 100}%` }} />
              </div>
              <span className="trend-value">{r.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
