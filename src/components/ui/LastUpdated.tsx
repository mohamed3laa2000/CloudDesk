import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface LastUpdatedProps {
  timestamp: Date;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const LastUpdated: React.FC<LastUpdatedProps> = ({
  timestamp,
  onRefresh,
  isRefreshing = false,
}) => {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const updateSeconds = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
      setSecondsAgo(diff);
    };

    updateSeconds();
    const interval = setInterval(updateSeconds, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  const formatTime = (seconds: number) => {
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span>Updated {formatTime(secondsAgo)}</span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          title="Refresh now"
        >
          <RefreshCw
            className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      )}
    </div>
  );
};
