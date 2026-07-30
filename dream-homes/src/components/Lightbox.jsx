import { useState, useEffect, useCallback, useRef } from 'react';
import SafeImage from './SafeImage';

export default function Lightbox({ isOpen, images, currentIndex: externalIndex, imageUrl, imageAlt, onClose, onIndexChange }) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  const imageList = images && images.length > 0 ? images : (imageUrl ? [imageUrl] : []);
  const isControlled = externalIndex !== undefined;
  const currentIdx = isControlled ? externalIndex : internalIndex;

  const updateIndex = useCallback((updater) => {
    const nextIdx = updater(isControlled ? externalIndex : internalIndex);
    if (isControlled && onIndexChange) {
      onIndexChange(nextIdx);
    } else {
      setInternalIndex(nextIdx);
    }
  }, [isControlled, externalIndex, internalIndex, onIndexChange]);

  const goNext = useCallback(() => {
    if (imageList.length <= 1) return;
    updateIndex(prev => (prev + 1) % imageList.length);
  }, [imageList.length, updateIndex]);

  const goPrev = useCallback(() => {
    if (imageList.length <= 1) return;
    updateIndex(prev => (prev - 1 + imageList.length) % imageList.length);
  }, [imageList.length, updateIndex]);

  useEffect(() => {
    if (isOpen && imageList.length > 1 && !paused) {
      intervalRef.current = setInterval(goNext, 4000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isOpen, imageList.length, paused, goNext]);

  useEffect(() => {
    const handleKey = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev(); }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, goNext, goPrev]);

  if (!isOpen || imageList.length === 0) return null;

  return (
    <div
      className="lightbox-overlay"
      onClick={onClose}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button className="lightbox-close" onClick={onClose}>×</button>

      {imageList.length > 1 && (
        <>
          <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); goPrev(); }} aria-label="Previous">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); goNext(); }} aria-label="Next">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </>
      )}

      <div className="lightbox-counter">
        {currentIdx + 1} / {imageList.length}
      </div>

      <SafeImage
        src={imageList[currentIdx]}
        alt={imageAlt || `Photo ${currentIdx + 1}`}
        className="lightbox-image"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
