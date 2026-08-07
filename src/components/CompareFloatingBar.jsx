import { useContext } from 'react';
import { CompareContext } from '../context/CompareContext';
import { Link } from 'react-router';

export default function CompareFloatingBar() {
  const { compareList, removeFromCompare } = useContext(CompareContext);

  if (compareList.length === 0) return null;

  return (
    <div className="compare-bar">
      <div className="container compare-bar-inner">
        <span>{compareList.length} selected</span>
        <div className="compare-thumbs">
          {compareList.map(p => (
            <div key={p.id} className="compare-thumb">
              <img src={p.image || '/placeholder.jpg'} alt={p.title} />
              <button className="compare-remove" onClick={() => removeFromCompare(p.id)}>&times;</button>
            </div>
          ))}
        </div>
        <Link to="/compare" className="btn btn-sm">Compare</Link>
      </div>
    </div>
  );
}