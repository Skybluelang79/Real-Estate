import { useState, useEffect, useRef } from 'react';
import SafeImage from './SafeImage';
import API_URL from '../config';

export default function Sponsors() {
  const [sponsors, setSponsors] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/sponsors`)
      .then((res) => res.json())
      .then((data) => setSponsors(data.sponsors || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!scrollRef.current || sponsors.length === 0) return;
    const el = scrollRef.current;
    let animId;
    let speed = 0.5;

    function scroll() {
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
        el.scrollLeft = 0;
      } else {
        el.scrollLeft += speed;
      }
      animId = requestAnimationFrame(scroll);
    }

    const timer = setTimeout(() => {
      animId = requestAnimationFrame(scroll);
    }, 2000);

    const handleEnter = () => cancelAnimationFrame(animId);
    const handleLeave = () => { animId = requestAnimationFrame(scroll); };

    el.addEventListener('mouseenter', handleEnter);
    el.addEventListener('mouseleave', handleLeave);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animId);
      el.removeEventListener('mouseenter', handleEnter);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [sponsors]);

  if (sponsors.length === 0) return null;

  return (
    <section className="sponsors-section">
      <div className="section-header">
        <h2>Our Trusted Partners</h2>
        <p>Industry leaders who help make homeownership possible</p>
      </div>
      <div className="sponsors-scroll" ref={scrollRef}>
        <div className="sponsors-track">
          {[...sponsors, ...sponsors, ...sponsors].map((sponsor, i) => (
            <div key={`${sponsor.id}-${i}`} className={`sponsor-card sponsor-${sponsor.tier}`}>
              <div className="sponsor-logo-wrap">
                <SafeImage src={sponsor.logo} alt={sponsor.name} className="sponsor-logo" />
              </div>
              <h4 className="sponsor-name">{sponsor.name}</h4>
              <p className="sponsor-desc">{sponsor.description}</p>
              {sponsor.tier && <span className="sponsor-tier">{sponsor.tier}</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
