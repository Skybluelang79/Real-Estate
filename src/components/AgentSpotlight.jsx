import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import API_URL from '../config';
import SafeImage from './SafeImage';
import AgentRating from './AgentRating';
import { useLanguage } from '../context/LanguageContext';

export default function AgentSpotlight() {
  const { t } = useLanguage();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/agents`)
      .then((r) => r.json())
      .then((data) => {
        setAgents(data.agents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && agents.length === 0) return null;

  return (
    <section className="section agents-spotlight-section">
      <div className="container">
        <div className="section-header section-header-row">
          <div>
            <h2>{t('home.agents.title')}</h2>
            <p>{t('home.agents.subtitle')}</p>
          </div>
          <div className="section-header-actions">
            <Link to="/agents" className="btn-ghost btn-sm">{t('home.agents.viewAll')}</Link>
          </div>
        </div>
        <div className="agent-spotlight-grid">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="agent-spotlight-card skeleton-card">
                  <div className="skeleton-img agent-spotlight-avatar" />
                  <div className="skeleton-body">
                    <div className="skeleton-line skeleton-lg" />
                    <div className="skeleton-line skeleton-sm" />
                  </div>
                </div>
              ))
            : agents.slice(0, 3).map((agent) => (
                <Link to={`/agents/${agent.id}`} key={agent.id} className="agent-spotlight-card">
                  <div className="agent-spotlight-avatar">
                    {agent.photo ? <SafeImage src={agent.photo} alt={agent.name} /> : <span>{agent.name?.charAt(0) || 'A'}</span>}
                  </div>
                  <h3>{agent.name}</h3>
                  <p className="agent-spotlight-title">{agent.title || 'Real Estate Advisor'}</p>
                  <AgentRating id={agent.id} />
                  {agent.listingCount > 0 && (
                    <span className="agent-spotlight-listings">
                      {agent.listingCount} {agent.listingCount === 1 ? 'listing' : 'listings'}
                    </span>
                  )}
                  <span className="agent-spotlight-cta">View Profile →</span>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
