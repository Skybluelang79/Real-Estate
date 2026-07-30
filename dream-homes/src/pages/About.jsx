import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SafeImage from '../components/SafeImage';
import Breadcrumbs from '../components/Breadcrumbs';
import usePageTitle from '../hooks/usePageTitle';

function AnimatedCounter({ end, duration = 2000, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const animate = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, end, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const teamMembers = [
  { name: 'Sarah Johnson', role: 'CEO & Founder', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face' },
  { name: 'Michael Chen', role: 'Head of Sales', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face' },
  { name: 'Emily Rodriguez', role: 'Lead Agent', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face' },
  { name: 'David Park', role: 'Property Manager', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face' },
];

export default function About() {
  usePageTitle('About');
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="section properties-page">
      <div className="container">
        <Breadcrumbs />
        <div className="about-hero">
          <h1>About Dream Homes</h1>
          <p>We've been helping families find their perfect homes since 2010. Our commitment to excellence and deep market knowledge sets us apart.</p>
        </div>

        <div ref={ref} className={`about-stats-row ${visible ? 'about-stats-visible' : ''}`}>
          <div className="about-stat-card">
            <div className="about-stat-number"><AnimatedCounter end={15} suffix="+" /></div>
            <div className="about-stat-label">Years Experience</div>
          </div>
          <div className="about-stat-card">
            <div className="about-stat-number"><AnimatedCounter end={5000} suffix="+" /></div>
            <div className="about-stat-label">Homes Sold</div>
          </div>
          <div className="about-stat-card">
            <div className="about-stat-number"><AnimatedCounter end={98} suffix="%" /></div>
            <div className="about-stat-label">Client Satisfaction</div>
          </div>
          <div className="about-stat-card">
            <div className="about-stat-number"><AnimatedCounter end={200} suffix="+" /></div>
            <div className="about-stat-label">Expert Agents</div>
          </div>
        </div>

        <div className="about-story">
          <div className="about-story-text">
            <h2>Our Story</h2>
            <p>Founded in 2010, Dream Homes Real Estate began with a simple mission: to help people find not just a house, but a home. What started as a small team of passionate real estate professionals has grown into one of the most trusted names in the industry.</p>
            <p>We believe that every client deserves personalized attention, expert guidance, and access to the finest properties on the market. Our deep understanding of local markets, combined with innovative technology, makes the home buying and selling process seamless and enjoyable.</p>
          </div>
          <div className="about-story-image">
            <SafeImage src="https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800&h=400&fit=crop" alt="Our team" />
          </div>
        </div>

        <div className="about-values">
          <h2>Our Values</h2>
          <div className="about-values-grid">
            <div className="about-value-card">
              <div className="about-value-icon">🎯</div>
              <h3>Integrity</h3>
              <p>We conduct business with the highest ethical standards, always putting our clients' interests first.</p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon">💡</div>
              <h3>Innovation</h3>
              <p>We leverage cutting-edge technology and creative strategies to deliver exceptional results.</p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon">🤝</div>
              <h3>Partnership</h3>
              <p>We build lasting relationships with our clients, partners, and communities.</p>
            </div>
            <div className="about-value-card">
              <div className="about-value-icon">⭐</div>
              <h3>Excellence</h3>
              <p>We strive for excellence in everything we do, from property listings to client service.</p>
            </div>
          </div>
        </div>

        <div className="about-team">
          <h2>Meet Our Team</h2>
          <div className="about-team-grid">
            {teamMembers.map((member, i) => (
              <div key={i} className="about-team-card">
                <SafeImage src={member.image} alt={member.name} />
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="about-cta">
          <h2>Ready to Find Your Dream Home?</h2>
          <p>Let our expert agents help you find the perfect property.</p>
          <Link to="/properties" className="btn-primary">Browse Properties</Link>
        </div>
      </div>
    </section>
  );
}
