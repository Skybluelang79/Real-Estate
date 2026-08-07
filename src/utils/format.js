export function formatPrice(price) {
  if (!price) return '$0';
  const num = parseInt(String(price).replace(/[$,]/g, ''));
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}

export function formatFullPrice(price) {
  if (!price && price !== 0) return 'N/A';
  const num = Number(price);
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function toCurrency(num) {
  if (num === null || num === undefined || isNaN(num)) return '$0';
  return `$${Number(num).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
