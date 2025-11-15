import { useState, useCallback } from 'react';

/**
 * Hook for optimistic UI updates with rollback on error
 */
export function useOptimisticUpdate<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const updateOptimistically = useCallback(
    async (
      newValue: T,
      asyncAction: () => Promise<void>
    ): Promise<boolean> => {
      const previousValue = value;
      
      // Optimistically update UI
      setValue(newValue);
      setIsOptimistic(true);

      try {
        // Perform async action
        await asyncAction();
        setIsOptimistic(false);
        return true;
      } catch (error) {
        // Rollback on error
        setValue(previousValue);
        setIsOptimistic(false);
        return false;
      }
    },
    [value]
  );

  return {
    value,
    setValue,
    isOptimistic,
    updateOptimistically,
  };
}
