import { useState, useEffect } from 'react';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageCtx';
import { calculateMortgage } from '../utils/mortgage';

export default function MortgageCalculator({ isOpen, onClose }) {
  const { t } = useLanguage();
  const [homePrice, setHomePrice] = useState(500000);
  const [downPayment, setDownPayment] = useState(100000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [result, setResult] = useState(null);
  const [pqForm, setPqForm] = useState({ name: '', email: '', phone: '' });
  const [pqStatus, setPqStatus] = useState('');
  const [pqSubmitting, setPqSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const calculate = () => {
    setError('');
    if (!(homePrice > 0)) {
      setError('Please enter a home price greater than $0.');
      setResult(null);
      return;
    }
    if (!(downPayment >= 0) || downPayment >= homePrice) {
      setError('Down payment must be between $0 and the home price.');
      setResult(null);
      return;
    }
    if (!(interestRate > 0) || interestRate > 20) {
      setError('Interest rate must be between 0% and 20%.');
      setResult(null);
      return;
    }
    if (!(loanTerm > 0)) {
      setError('Loan term must be greater than 0.');
      setResult(null);
      return;
    }
    setResult(calculateMortgage({ homePrice, downPayment, interestRate, loanTerm }));
  };

  const submitPrequal = async (e) => {
    e.preventDefault();
    setPqStatus('');
    if (pqSubmitting) return;
    if (!pqForm.name || !pqForm.email) {
      setPqStatus(t('prequal.error'));
      return;
    }
    if (!(homePrice > 0)) {
      setPqStatus('Please calculate a valid mortgage first.');
      return;
    }
    setPqSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/pre-qualifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pqForm.name,
          email: pqForm.email,
          phone: pqForm.phone,
          homePrice,
          downPayment,
          interestRate,
          loanTerm,
          monthlyPayment: result ? parseFloat(result.monthly) : null,
        }),
      });
      if (res.ok) {
        setPqStatus(t('prequal.success'));
        setPqForm({ name: '', email: '', phone: '' });
      } else {
        setPqStatus(t('prequal.error'));
      }
    } catch {
      setPqStatus(t('prequal.error'));
    } finally {
      setPqSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="modal-content mortgage-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="mc-title">
        <button className="modal-close" onClick={onClose} aria-label="Close mortgage calculator">×</button>
        <h2 id="mc-title">Mortgage Calculator</h2>
        <div className="mortgage-form">
          <div className="mortgage-field">
            <label htmlFor="mortgage-home-price">Home Price ($)</label>
            <input
              id="mortgage-home-price"
              type="number"
              value={homePrice}
              onChange={(e) => setHomePrice(Number(e.target.value))}
            />
          </div>
          <div className="mortgage-field">
            <label htmlFor="mortgage-down-payment">Down Payment ($)</label>
            <input
              id="mortgage-down-payment"
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
            />
          </div>
          <div className="mortgage-field">
            <label htmlFor="mortgage-interest-rate">Interest Rate (%)</label>
            <input
              id="mortgage-interest-rate"
              type="number"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
            />
          </div>
          <div className="mortgage-field">
            <label htmlFor="mortgage-loan-term">Loan Term (years)</label>
            <select id="mortgage-loan-term" value={loanTerm} onChange={(e) => setLoanTerm(Number(e.target.value))}>
              <option value={0.5}>6 months</option>
              <option value={1}>1 year</option>
              <option value={10}>10 years</option>
              <option value={15}>15 years</option>
              <option value={20}>20 years</option>
              <option value={30}>30 years</option>
            </select>
          </div>
          <button className="btn-primary mortgage-calc-btn" onClick={calculate}>
            Calculate
          </button>
        </div>
        {error && <p className="mortgage-error" style={{ color: '#b00020', marginTop: 12 }}>{error}</p>}
        {result && (
          <div className="mortgage-results">
            <div className="mortgage-result-item">
              <span className="result-label">Monthly Payment</span>
              <span className="result-value">${Number(result.monthly).toLocaleString()}</span>
            </div>
            <div className="mortgage-result-item">
              <span className="result-label">Total Interest</span>
              <span className="result-value">${Number(result.totalInterest).toLocaleString()}</span>
            </div>
            <div className="mortgage-result-item">
              <span className="result-label">Total Payment</span>
              <span className="result-value">${Number(result.totalPayment).toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="prequal-box">
          <h3>{t('prequal.title')}</h3>
          <p className="admin-sub-text">{t('prequal.subtitle')}</p>
          <form onSubmit={submitPrequal} className="tour-form">
            <div className="form-row-2">
              <input type="text" placeholder={t('prequal.name')} aria-label="Name" value={pqForm.name} onChange={(e) => setPqForm({ ...pqForm, name: e.target.value })} />
              <input type="email" placeholder={t('prequal.email')} aria-label="Email" value={pqForm.email} onChange={(e) => setPqForm({ ...pqForm, email: e.target.value })} />
            </div>
            <input type="tel" placeholder={t('prequal.phone')} aria-label="Phone number" value={pqForm.phone} onChange={(e) => setPqForm({ ...pqForm, phone: e.target.value })} />
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={pqSubmitting}>{pqSubmitting ? 'Submitting…' : t('prequal.submit')}</button>
            {pqStatus && <p className="form-status-msg">{pqStatus}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
