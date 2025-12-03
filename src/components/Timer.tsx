import { useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useExamStore } from '@/hooks/useExamStore';
import { cn } from '@/lib/utils';

interface TimerProps {
  onTimeUp: () => void;
}

export function Timer({ onTimeUp }: TimerProps) {
  const { timeRemaining, decrementTime, isSubmitted } = useExamStore();

  useEffect(() => {
    if (isSubmitted) return;

    const interval = setInterval(() => {
      decrementTime();
    }, 1000);

    return () => clearInterval(interval);
  }, [decrementTime, isSubmitted]);

  useEffect(() => {
    if (timeRemaining === 0 && !isSubmitted) {
      onTimeUp();
    }
  }, [timeRemaining, onTimeUp, isSubmitted]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const getTimerClass = () => {
    if (timeRemaining > 600) return 'timer-safe';
    if (timeRemaining > 300) return 'timer-warning';
    return 'timer-danger';
  };

  return (
    <div className={cn('flex items-center gap-2 font-mono text-xl font-semibold', getTimerClass())}>
      <Clock className="w-5 h-5" />
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
