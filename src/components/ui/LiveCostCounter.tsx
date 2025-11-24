import React, { useState, useEffect } from 'react';

interface LiveCostCounterProps {
  hourlyRate: number;
  isRunning: boolean;
  startTime?: Date;
  className?: string;
}

export const LiveCostCounter: React.FC<LiveCostCounterProps> = ({
  hourlyRate,
  isRunning,
  startTime = new Date(),
  className = '',
}) => {
  const [currentCost, setCurrentCost] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setCurrentCost(0);
      return;
    }

    const updateCost = () => {
      const now = new Date();
      const start = startTime instanceof Date ? startTime : new Date(startTime);
      const hoursElapsed = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
      const cost = hoursElapsed * hourlyRate;
      setCurrentCost(cost);
    };

    updateCost();
    const interval = setInterval(updateCost, 1000); // Update every second

    return () => clearInterval(interval);
  }, [hourlyRate, isRunning, startTime]);

  if (!isRunning) {
    return (
      <span className={`text-gray-500 ${className}`}>
        Rp 0
      </span>
    );
  }

  return (
    <span className={`font-mono text-emerald-600 ${className}`}>
      Rp {currentCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
    </span>
  );
};
