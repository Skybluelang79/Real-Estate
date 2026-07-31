import { useState } from 'react';

const FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="%23E5DDD4"%3E%3Crect width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239C948A" font-family="sans-serif" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';

export default function SafeImage({ src, alt, className, style, ...props }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(FALLBACK);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
}
