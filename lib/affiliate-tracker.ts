import { useEffect } from 'react';

export const useAffiliateTracker = (type: 'user' | 'adver' | 'recruit') => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');

    if (ref) {
      localStorage.setItem('affiliate_ref_id', ref);
      localStorage.setItem('affiliate_type', type);

      // APIを叩いてクリック数をカウント
      fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refId: ref, type: type }),
      }).catch(err => console.error('Tracking failed', err));
    }
  }, [type]);
};