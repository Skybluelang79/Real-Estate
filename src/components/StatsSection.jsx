import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageCtx';
import neighborhoods from '../data/neighborhoods';
import API_URL from '../config';

const DEFAULTS = {
  properties: 250,
  agents: 12,
  neighborhoods: neighborhoods.length,
  years: 10,
};

function useCountUp(target, inView, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView || target === undefined || target === null) return;
    const start = performance.now();
    const total = Math.max(0, target);
    let raf;
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(total * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);
  return value;
}

function StatItem({ icon, value, suffix, label }) {
  return (
    <div className="stat-item">
      <div className="stat-icon">{icon}</div>
      <div className="stat-number">{value.toLocaleString()}{suffix && <span className="stat-suffix">{suffix}</span>}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function StatsSection() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(DEFAULTS);
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`${API_URL}/api/properties?limit=1`).then((r) => r.json()).catch(() => null),
      fetch(`${API_URL}/api/agents`).then((r) => r.json()).catch(() => null),
    ]).then(([properties, agents]) => {
      if (cancelled) return;
      setStats({
        properties: properties?.total ?? DEFAULTS.properties,
        agents: (agents?.agents || []).length || DEFAULTS.agents,
        neighborhoods: neighborhoods.length,
        years: DEFAULTS.years,
      });
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const targetProperties = inView ? stats.properties : 0;
  const targetAgents = inView ? stats.agents : 0;
  const targetNeighborhoods = inView ? stats.neighborhoods : 0;
  const targetYears = inView ? stats.years : 0;

  const properties = useCountUp(targetProperties, true);
  const agents = useCountUp(targetAgents, true);
  const neighborhoodsCount = useCountUp(targetNeighborhoods, true);
  const years = useCountUp(targetYears, true);

  return (
    <section className="stats-section" ref={ref}>
      <div className="container">
        <div className="stats-grid">
          <StatItem
            icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 22V7l9-5 9 5v15"/><path d="M9 22V12h6v10"/></svg>}
            value={properties}
            suffix="+"
            label={t('stats.properties')}
          />
          <StatItem
            icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
            value={agents}
            suffix="+"
            label={t('stats.agents')}
          />
          <StatItem
            icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
            value={neighborhoodsCount}
            label={t('stats.neighborhoods')}
          />
          <StatItem
            icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
            value={years}
            suffix="+"
            label={t('stats.years')}
          />
        </div>
      </div>
    </section>
  );
}
