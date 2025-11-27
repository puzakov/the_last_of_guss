import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { RoundStatus } from '../../types';

interface TimerProps {
  startDate: string;
  endDate: string;
  status: RoundStatus;
  onStatusChange?: (status: RoundStatus) => void;
}

export default function Timer({ startDate, endDate, status, onStatusChange }: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      let remaining = 0;

      if (status === RoundStatus.COOLDOWN) {
        remaining = new Date(startDate).getTime() - now;
      } else if (status === RoundStatus.ACTIVE) {
        remaining = new Date(endDate).getTime() - now;
      }

      if (remaining <= 0) {
        setTimeRemaining(0);
        // Проверяем изменение статуса
        if (status === RoundStatus.COOLDOWN && onStatusChange) {
          onStatusChange(RoundStatus.ACTIVE);
        } else if (status === RoundStatus.ACTIVE && onStatusChange) {
          onStatusChange(RoundStatus.FINISHED);
        }
      } else {
        setTimeRemaining(Math.floor(remaining / 1000));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startDate, endDate, status, onStatusChange]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (status === RoundStatus.FINISHED) {
    return null;
  }

  return (
    <Typography variant="h6" sx={{ mb: 2 }}>
      {status === RoundStatus.COOLDOWN ? 'До начала раунда' : 'До конца осталось'}:{' '}
      {formatTime(timeRemaining)}
    </Typography>
  );
}

