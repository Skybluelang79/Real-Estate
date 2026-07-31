export default function NeighborhoodInsights({ property }) {
  const data = {
    schools: [
      { name: 'Lincoln Elementary', rating: 4, type: 'K-5' },
      { name: 'Washington Middle School', rating: 3, type: '6-8' },
      { name: 'Jefferson High School', rating: 4, type: '9-12' },
    ],
    commute: [
      { destination: 'Downtown', min: 15 },
      { destination: 'Airport', min: 25 },
      { destination: 'Shopping Mall', min: 10 },
    ],
    demographics: {
      population: '52,340',
      medianAge: 34,
      medianIncome: '$78,500',
      homeOwnership: '62%',
    },
  };

  return (
    <div className="neighborhood-section">
      <h2>Neighborhood Insights</h2>
      <p className="text-muted">
        {property?.location || 'This area'} &mdash; Discover what makes this neighborhood unique
      </p>

      <div className="insights-grid">
        <div className="insight-card">
          <h3>Nearby Schools</h3>
          {data.schools.map((s, i) => (
            <div key={i} className="insight-item">
              <strong>{s.name}</strong>
              <span>{'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)} &middot; {s.type}</span>
            </div>
          ))}
        </div>

        <div className="insight-card">
          <h3>Commute Times</h3>
          {data.commute.map((c, i) => (
            <div key={i} className="insight-item">
              <span>{c.destination}</span>
              <strong>~{c.min} min</strong>
            </div>
          ))}
        </div>

        <div className="insight-card">
          <h3>Area Overview</h3>
          <div className="insight-stat">
            <span>Population</span> <strong>{data.demographics.population}</strong>
          </div>
          <div className="insight-stat">
            <span>Median Age</span> <strong>{data.demographics.medianAge}</strong>
          </div>
          <div className="insight-stat">
            <span>Median Income</span> <strong>{data.demographics.medianIncome}</strong>
          </div>
          <div className="insight-stat">
            <span>Home Ownership</span> <strong>{data.demographics.homeOwnership}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}