import { useState, useEffect } from 'react';

export default function MortgageCalculator({ isOpen, onClose }) {
  const [homePrice, setHomePrice] = useState(500000);
  const [downPayment, setDownPayment] = useState(100000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [result, setResult] = useState(null);

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
    const principal = homePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;

    if (monthlyRate === 0) {
      const monthly = principal / numPayments;
      setResult({
        monthly: monthly.toFixed(2),
        totalPayment: principal.toFixed(2),
        totalInterest: '0.00',
      });
      return;
    }

    const factor = Math.pow(1 + monthlyRate, numPayments);
    const monthly = (principal * monthlyRate * factor) / (factor - 1);
    const totalPayment = monthly * numPayments;
    const totalInterest = totalPayment - principal;

    setResult({
      monthly: monthly.toFixed(2),
      totalPayment: totalPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
    });
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
      </div>
    </div>
  );
}
