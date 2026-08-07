export function calculateMortgage({ homePrice, downPayment, interestRate, loanTerm }) {
  const principal = homePrice - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTerm * 12;

  if (monthlyRate === 0) {
    const monthly = principal / numPayments;
    return {
      monthly: monthly.toFixed(2),
      totalPayment: principal.toFixed(2),
      totalInterest: '0.00',
    };
  }

  const factor = Math.pow(1 + monthlyRate, numPayments);
  const monthly = (principal * monthlyRate * factor) / (factor - 1);
  const totalPayment = monthly * numPayments;
  const totalInterest = totalPayment - principal;

  return {
    monthly: monthly.toFixed(2),
    totalPayment: totalPayment.toFixed(2),
    totalInterest: totalInterest.toFixed(2),
  };
}

export function parsePriceInput(value) {
  const num = parseFloat(String(value).replace(/[$, ]/g, ''));
  return isNaN(num) || num < 0 ? 0 : num;
}
