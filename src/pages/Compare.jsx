import { useContext } from 'react';
import { CompareContext } from '../context/CompareContext';
import { Link } from 'react-router';

export default function Compare() {
  const { compareList, removeFromCompare, clearCompare } = useContext(CompareContext);

  const fields = [
    { key: 'price', label: 'Price', fmt: v => `$${Number(v).toLocaleString()}` },
    { key: 'bedrooms', label: 'Bedrooms' },
    { key: 'bathrooms', label: 'Bathrooms' },
    { key: 'sqft', label: 'Sq Ft', fmt: v => v ? `${Number(v).toLocaleString()} sqft` : 'N/A' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'yearBuilt', label: 'Year Built' },
    { key: 'location', label: 'Location' },
  ];

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
                      <img src={p.image || '/placeholder.jpg'} alt={p.title} className="compare-img" />
                      <h3>{p.title}</h3>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map(f => (
                  <tr key={f.key}>
                    <td className="compare-label">{f.label}</td>
                    {compareList.map(p => (
                      <td key={p.id}>
                        {p[f.key] !== undefined && p[f.key] !== null
                          ? (f.fmt ? f.fmt(p[f.key]) : String(p[f.key]))
                          : 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="compare-label">Features</td>
                  {compareList.map(p => (
                    <td key={p.id}>{p.features ? p.features.split(',').join(', ') : 'N/A'}</td>
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