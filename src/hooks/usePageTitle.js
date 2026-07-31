import { useEffect } from 'react';

const BASE = 'Dream Homes';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE}` : BASE;
  }, [title]);
}
