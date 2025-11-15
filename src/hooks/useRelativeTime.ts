import { useState, useEffect } from 'react';

/**
 * Hook that returns a relative time string that updates automatically
 */
export function useRelativeTime(date: Date | string): string {
  const [relativeTime, setRelativeTime] = useState('');

  useEffect(() => {
    const updateRelativeTime = () => {
      const now = new Date();
      const targetDate = typeof date === 'string' ? new Date(date) : date;
      const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

      if (diffInSeconds < 10) {
        setRelativeTime('just now');
      } else if (diffInSeconds < 60) {
        setRelativeTime(`${diffInSeconds}s ago`);
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        setRelativeTime(`${minutes}m ago`);
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        setRelativeTime(`${hours}h ago`);
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        setRelativeTime(`${days}d ago`);
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, [date]);

  return relativeTime;
}
