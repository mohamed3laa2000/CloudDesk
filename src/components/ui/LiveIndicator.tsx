import React from 'react';

interface LiveIndicatorProps {
  status: 'running' | 'stopped' | 'provisioning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = false,
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const colorClasses = {
    running: 'bg-emerald-500',
    stopped: 'bg-gray-400',
    provisioning: 'bg-blue-500',
    error: 'bg-red-500',
  };

  const shouldPulse = status === 'running' || status === 'provisioning';

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} ${colorClasses[status]} rounded-full`}
        />
        {shouldPulse && (
          <div
            className={`absolute inset-0 ${colorClasses[status]} rounded-full animate-ping opacity-75`}
          />
        )}
      </div>
      {showLabel && (
        <span className="text-xs text-gray-600 capitalize">{status}</span>
      )}
    </div>
  );
};
