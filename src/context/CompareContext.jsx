import { useState, useEffect } from 'react';
import CompareContext from './CompareCtx';

export { default as CompareContext } from './CompareCtx';

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('compareList') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('compareList', JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = (property) => {
    setCompareList(prev => {
      if (prev.length >= 4 || prev.find(p => p.id === property.id)) return prev;
      return [...prev, property];
    });
  };

  const removeFromCompare = (id) => {
    setCompareList(prev => prev.filter(p => p.id !== id));
  };

  const clearCompare = () => setCompareList([]);

  const isInCompare = (id) => compareList.some(p => p.id === id);

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
}
