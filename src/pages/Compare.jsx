import { useContext } from 'react';
import { CompareContext } from '../context/CompareContext';
import { Link } from 'react-router';

export default function Compare() {
  const { compareList, removeFromCompare, clearCompare } = useContext(CompareContext);

  const fields = [
    { label: 'Price', value: p => (p.price != null ? `$${Number(p.price).toLocaleString()}` : 'N/A') },
    { label: 'Bedrooms', value: p => p.beds ?? 'N/A' },
    { label: 'Bathrooms', value: p => p.baths ?? 'N/A' },
    { label: 'Sq Ft', value: p => { const s = p.sqft || p.size; return s ? `${Number(s).toLocaleString()} sqft` : 'N/A'; } },
    { label: 'Type', value: p => p.type || 'N/A' },
    { label: 'Status', value: p => p.status || 'N/A' },
    { label: 'Year Built', value: p => p.yearBuilt || 'N/A' },
    { label: 'Location', value: p => [p.city, p.state].filter(Boolean).join(', ') || 'N/A' },
  ];

  const featureText = (p) => {
    if (Array.isArray(p.amenities)) return p.amenities.join(', ');
    if (typeof p.amenities === 'string') return p.amenities;
    return 'N/A';
  };

  return (
    <div className="page compare-page">
      <div className="page-header">
        <div className="container">
          <h1>Compare Properties</h1>
          {compareList.length > 0 && (
            <button className="btn btn-sm" onClick={clearCompare}>Clear All</button>
          )}
        </div>
      </div>
      <div className="container">
        {compareList.length === 0 ? (
          <div className="empty-state">
            <p>No properties to compare.</p>
            <Link to="/" className="btn">Browse Properties</Link>
          </div>
        ) : (
          <div className="compare-table-wrapper">
            <table className="compare-table">
              <thead>
                <tr>
                  <th></th>
                  {compareList.map(p => (
                    <th key={p.id}>
                      <button className="compare-remove-btn" onClick={() => removeFromCompare(p.id)}>&times;</button>
                      <img src={p.image || '/placeholder.jpg'} alt={p.title} className="compare-img" loading="lazy" />
                      <h3>{p.title}</h3>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map(f => (
                  <tr key={f.label}>
                    <td className="compare-label">{f.label}</td>
                    {compareList.map(p => (
                      <td key={p.id}>{f.value(p)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="compare-label">Features</td>
                  {compareList.map(p => (
                    <td key={p.id}>{featureText(p)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}