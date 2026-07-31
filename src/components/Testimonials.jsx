import { useState, useEffect } from 'react';
import API_URL from '../config';

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/testimonials`)
      .then(r => r.json())
      .then(data => setTestimonials(data.testimonials || []))
      .catch(() => {});
  }, []);

  if (testimonials.length === 0) return null;

  const t = testimonials[index];

  return (
    <section className="section testimonials-section">
      <div className="container">
        <div className="section-header">
          <h2>What Our Clients Say</h2>
          <p>Hear from the families and investors we've helped</p>
        </div>
        <div className="testimonials-carousel">
          <div className="testimonial-card-active">
            <div className="testimonial-stars">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
            <p className="testimonial-content">"{t.content}"</p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">{t.name.charAt(0)}</div>
              <div>
                <strong>{t.name}</strong>
                <span>{t.role}</span>
              </div>
            </div>
          </div>
          {testimonials.length > 1 && (
            <div className="testimonial-dots">
              {testimonials.map((_, i) => (
                <button key={i} className={`testimonial-dot ${i === index ? 'active' : ''}`} onClick={() => setIndex(i)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}