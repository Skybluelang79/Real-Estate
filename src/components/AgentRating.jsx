import { agentRating, reviewCount } from '../utils/socialProof';

export default function AgentRating({ id, name, size = 14, showCount = true }) {
  const rating = agentRating(id ?? name ?? 0);
  return (
    <span className="agent-rating-line">
      <span className="agent-stars" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((s) => (
          <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.round(rating) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        ))}
      </span>
      <span className="agent-rating-num">{rating.toFixed(1)}</span>
      {showCount && <span className="agent-rating-count">({reviewCount(id ?? name ?? 0)} reviews)</span>}
    </span>
  );
}
