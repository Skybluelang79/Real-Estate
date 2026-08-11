const INT_MAX = 2147483647;

function hashCode(input) {
  let h = 0;
  const s = String(input ?? '');
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) % INT_MAX;
  }
  return h;
}

export function viewersFor(id) {
  const h = hashCode(id);
  return 7 + (h % 36);
}

export function agentRating(id) {
  const h = hashCode(id);
  return Math.min(5, 4.4 + (h % 9) / 10);
}

export function reviewCount(id) {
  const h = hashCode(id);
  return 8 + (h % 142);
}
