import React, { useState, useEffect } from 'react';

interface ProgressBarProps {
  duration?: number; // in milliseconds
  onComplete?: () => void;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  duration = 3000,
  onComplete,
  className = '',
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = 50; // Update every 50ms
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          if (onComplete) onComplete();
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, onComplete]);

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className="h-full bg-indigo-600 transition-all duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
