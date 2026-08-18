import { useState } from 'react';
import API_URL from '../config';
import Breadcrumbs from '../components/Breadcrumbs';
import usePageTitle from '../hooks/usePageTitle';

const faqs = [
  { q: 'How do I schedule a property viewing?', a: 'You can schedule a viewing by clicking the "Schedule Tour" button on any property listing page. Fill out the form with your preferred date and time, and our agent will confirm your appointment.' },
  { q: 'What documents do I need to buy a home?', a: 'Typically you will need: proof of income (pay stubs, W-2s), bank statements, tax returns, photo ID, and pre-approval letter from a lender. Requirements may vary by lender.' },
  { q: 'How long does the buying process take?', a: 'On average, the home buying process takes 30-60 days from accepted offer to closing. This can vary depending on financing, inspections, and other factors.' },
  { q: 'Do you offer virtual tours?', a: 'Yes! Many of our properties include virtual tour options. Look for the virtual tour icon on property listings, or ask your agent about available virtual viewing options.' },
  { q: 'What areas do you serve?', a: 'We serve the greater Los Angeles metropolitan area including Malibu, Beverly Hills, Santa Monica, Pasadena, Glendale, and surrounding communities.' },
];

export default function Contact() {
  usePageTitle('Contact');

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [openFaq, setOpenFaq] = useState(-1);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (form.message.trim().length < 10) errs.message = 'Message must be at least 10 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await fetch(`${API_URL}/api/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus('success');
      setForm({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
      setTimeout(() => setStatus(''), 5000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus(''), 5000);
    }
  };

  return (
    <section className="section properties-page">
      <div className="container">
        <Breadcrumbs />
        <div className="section-header"><h2>Contact Us</h2><p>We'd love to hear from you. Get in touch with our team.</p></div>

        <div className="contact-layout">
          <div className="contact-form-wrap">
            {status === 'success' && <div className="form-toast form-toast-success">Thank you! Your message has been sent.</div>}
            {status === 'error' && <div className="form-toast form-toast-error">Something went wrong. Please try again.</div>}

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="contact-name">Name</label>
                <input id="contact-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="contact-email">Email</label>
                  <input id="contact-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="contact-phone">Phone</label>
                  <input id="contact-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="contact-subject">Subject</label>
                <select id="contact-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option>General Inquiry</option>
                  <option>Property Question</option>
                  <option>Schedule Viewing</option>
                  <option>Partnership</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="contact-message">Message</label>
                <textarea id="contact-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} placeholder="Tell us how we can help..." maxLength={500} />
                <span className="char-counter">{form.message.length}/500</span>
                {errors.message && <span className="form-error">{errors.message}</span>}
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Send Message</button>
            </form>
          </div>

          <div className="contact-sidebar">
            <div className="contact-info-card">
              <h3>Get In Touch</h3>
              <div className="contact-info-item"><strong>Address</strong><span>123 Dream Street, Los Angeles, CA 90001</span></div>
              <div className="contact-info-item"><strong>Phone</strong><span>(800) 555-HOME</span></div>
              <div className="contact-info-item"><strong>Email</strong><span>info@dreamhomes.com</span></div>
              <div className="contact-info-item"><strong>Hours</strong><span>Mon-Fri: 9AM - 6PM<br />Sat: 10AM - 4PM<br />Sun: By Appointment</span></div>
            </div>
          </div>
        </div>

        <div className="contact-faq">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? 'faq-open' : ''}`}>
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} aria-expanded={openFaq === i}>
                  <span>{faq.q}</span>
                  <span className="faq-arrow">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <div className="faq-answer"><p>{faq.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
