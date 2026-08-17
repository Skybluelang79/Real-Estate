import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import API_URL from '../config';
import SafeImage from '../components/SafeImage';
import AgentRating from '../components/AgentRating';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/Breadcrumbs';
import { useLanguage } from '../context/LanguageCtx';

export default function Agents() {
  const { t } = useLanguage();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/agents`)
      .then(r => r.json())
      .then(data => { setAgents(data.agents || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="page agents-page">
      <Seo
        title={t('agents.title')}
        description="Meet the Dream Homes team — trusted advisors with deep knowledge of the Los Angeles luxury market."
        path="/agents"
      />
      <div className="page-header">
        <div className="container">
          <h1>{t('agents.title')}</h1>
          <p>{t('agents.subtitle')}</p>
        </div>
      </div>
      <div className="container">
        <Breadcrumbs current={t('agents.title')} />
        {loading ? (
          <p className="empty-state">Loading agents...</p>
        ) : agents.length === 0 ? (
          <p className="empty-state">{t('agents.empty')}</p>
        ) : (
          <div className="agents-grid">
            {agents.map((agent) => (
              <Link to={`/agents/${agent.id}`} key={agent.id} className="agent-card">
                <div className="agent-avatar">
                  {agent.photo ? <SafeImage src={agent.photo} alt={agent.name} /> : agent.name?.charAt(0) || 'A'}
                </div>
                <h3>{agent.name}</h3>
                <span className="agent-title">{agent.title || 'Real Estate Advisor'}</span>
                <AgentRating id={agent.id} />
                {agent.listingCount > 0 && (
                  <span className="agent-listings">{agent.listingCount} {agent.listingCount === 1 ? 'listing' : 'listings'}</span>
                )}
                <span className="agent-view-profile">{t('agents.viewProfile')} →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
