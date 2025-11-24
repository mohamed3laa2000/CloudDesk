import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export interface ProvisioningProgressProps {
  createdAt: string;
  variant?: 'compact' | 'full';
}

const PROVISIONING_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function ProvisioningProgress({ createdAt, variant = 'full' }: ProvisioningProgressProps) {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const updateProgress = () => {
      const startTime = new Date(createdAt).getTime();
      const now = Date.now();
      const elapsed = now - startTime;
      
      // Calculate progress percentage (0-100)
      const progressPercent = Math.min((elapsed / PROVISIONING_DURATION_MS) * 100, 100);
      setProgress(progressPercent);

      // Calculate time remaining
      const remaining = Math.max(PROVISIONING_DURATION_MS - elapsed, 0);
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      
      if (remaining > 0) {
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')} remaining`);
      } else {
        setTimeRemaining('Completing...');
      }
    };

    // Update immediately
    updateProgress();

    // Update every second
    const interval = setInterval(updateProgress, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap min-w-[80px]">
          {Math.round(progress)}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            Provisioning instance...
          </span>
        </div>
        <span className="text-gray-600 dark:text-gray-400">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {timeRemaining}
      </p>
    </div>
  );
}
