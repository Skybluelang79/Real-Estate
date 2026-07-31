import { useState, useEffect } from 'react';
import API_URL from '../config';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/agents`)
      .then(r => r.json())
      .then(data => setAgents(data.agents || []))
      .catch(() => {});
  }, []);

  return (
    <div className="page agents-page">
      <div className="page-header">
        <div className="container">
          <h1>Our Agents</h1>
          <p>Meet our team of real estate professionals</p>
        </div>
      </div>
      <div className="container">
        {agents.length === 0 ? (
          <p className="empty-state">No agents listed yet.</p>
        ) : (
          <div className="agents-grid">
            {agents.map((agent, i) => (
              <div
                key={i}
                className="agent-card"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="agent-avatar">{agent.agent?.charAt(0) || 'A'}</div>
                <h3>{agent.agent}</h3>
                {expanded === i && (
                  <div className="agent-details">
                    {agent.agentEmail && <p><strong>Email:</strong> {agent.agentEmail}</p>}
                    {agent.agentPhone && <p><strong>Phone:</strong> {agent.agentPhone}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}