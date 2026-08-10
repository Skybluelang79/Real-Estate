import { useRef, useState } from 'react';
import API_URL from '../config';

export default function PDFFlyer({ property, onClose }) {
  const flyerRef = useRef(null);
  const [building, setBuilding] = useState(false);

  const formatPrice = (price) => {
    const num = parseInt(String(price).replace(/[$,]/g, ''));
    return `$${num.toLocaleString()}`;
  };

  const download = async () => {
    if (building) return;
    setBuilding(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(flyerRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height / canvas.width) * pdfW;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`${(property.title || property.name || 'property').replace(/\s+/g, '-').toLowerCase()}-flyer.pdf`);
      onClose();
    } catch (err) {
      console.error('Failed to generate PDF', err);
    } finally {
      setBuilding(false);
    }
  };

  const name = property.title || property.name || 'Property';
  const displaySize = property.sqft || property.size || '—';
  const tags = property.tags
    ? (Array.isArray(property.tags) ? property.tags : String(property.tags).split(',').map(t => t.trim()).filter(Boolean))
    : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pdf-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Property Flyer Preview</h2>
        <div className="pdf-flyer" ref={flyerRef}>
          <div className="pdf-header">
            <h2>Dream Homes</h2>
            <p>Luxury Real Estate</p>
          </div>
          <div className="pdf-hero">
            <img src={property.image || `${API_URL}/placeholder.jpg`} alt={name} crossOrigin="anonymous" loading="lazy" />
          </div>
          <div className="pdf-body">
            <div className="pdf-price">{formatPrice(property.price)}</div>
            <h1>{name}</h1>
            <p className="pdf-location">{property.city}, {property.state} {property.zipcode || ''}</p>
            <div className="pdf-stats">
              <div className="pdf-stat"><strong>{property.beds}</strong><span>Beds</span></div>
              <div className="pdf-stat"><strong>{property.baths}</strong><span>Baths</span></div>
              <div className="pdf-stat"><strong>{Number(displaySize).toLocaleString()}</strong><span>Sq Ft</span></div>
              {property.yearBuilt && <div className="pdf-stat"><strong>{property.yearBuilt}</strong><span>Year</span></div>}
            </div>
            <p className="pdf-desc">{property.description}</p>
            {tags.length > 0 && (
              <div className="pdf-tags">{tags.map(t => <span key={t} className="pdf-tag">{t}</span>)}</div>
            )}
          </div>
          <div className="pdf-footer">
            <p>Dream Homes &mdash; dreamhomes.com &mdash; (800) 555-HOME</p>
          </div>
        </div>
        <div className="pdf-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={download} disabled={building}>
            {building ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}