import { useState, useEffect } from 'react';
import API_URL from '../config';
import { useLanguage } from '../context/LanguageContext';
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
    setResult(calculateMortgage({ homePrice, downPayment, interestRate, loanTerm }));
  };

  const submitPrequal = async (e) => {
    e.preventDefault();
    setPqStatus('');
    if (!pqForm.name || !pqForm.email) {
      setPqStatus(t('prequal.error'));
      return;
    }
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
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content mortgage-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Mortgage Calculator</h2>
        <div className="mortgage-form">
          <div className="mortgage-field">
            <label>Home Price ($)</label>
            <input
              type="number"
              value={homePrice}
              onChange={(e) => setHomePrice(Number(e.target.value))}
            />
          </div>
          <div className="mortgage-field">
            <label>Down Payment ($)</label>
            <input
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
            />
          </div>
          <div className="mortgage-field">
            <label>Interest Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
            />
          </div>
          <div className="mortgage-field">
            <label>Loan Term (years)</label>
            <select value={loanTerm} onChange={(e) => setLoanTerm(Number(e.target.value))}>
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
              <input type="text" placeholder={t('prequal.name')} value={pqForm.name} onChange={(e) => setPqForm({ ...pqForm, name: e.target.value })} />
              <input type="email" placeholder={t('prequal.email')} value={pqForm.email} onChange={(e) => setPqForm({ ...pqForm, email: e.target.value })} />
            </div>
            <input type="tel" placeholder={t('prequal.phone')} value={pqForm.phone} onChange={(e) => setPqForm({ ...pqForm, phone: e.target.value })} />
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>{t('prequal.submit')}</button>
            {pqStatus && <p className="form-status-msg">{pqStatus}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
