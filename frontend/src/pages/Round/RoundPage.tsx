import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUnit } from 'effector-react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  $currentRound,
  $roundStatus,
  $myScore,
  fetchRoundFx,
  tapFx,
  checkRoundStatusFx,
} from '../../stores/current-round.store';
import { RoundStatus } from '../../types';
import Goose from '../../components/Goose/Goose';
import Timer from '../../components/Timer/Timer';

export default function RoundPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentRound = useUnit($currentRound);
  const roundStatus = useUnit($roundStatus);
  const myScore = useUnit($myScore);
  const [isTapping, setIsTapping] = useState(false);
  const [tapError, setTapError] = useState('');

  useEffect(() => {
    if (id) {
      fetchRoundFx(id);
    }
  }, [id]);

  useEffect(() => {
    // Периодически обновляем раунд для синхронизации
    if (!id) return;

    const interval = setInterval(() => {
      fetchRoundFx(id);
    }, 5000); // каждые 5 секунд

    return () => clearInterval(interval);
  }, [id]);

  const handleStatusChange = async () => {
    if (id) {
      try {
        await checkRoundStatusFx(id);
        await fetchRoundFx(id);
      } catch (error) {
        console.error('Error checking round status:', error);
      }
    }
  };

  const handleTap = async () => {
    if (!id || roundStatus !== RoundStatus.ACTIVE || isTapping) return;

    setIsTapping(true);
    setTapError('');

    try {
      await tapFx(id);
      // Обновляем раунд после тапа
      await fetchRoundFx(id);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка при тапе';
      setTapError(errorMessage);
      // Если раунд завершен или не начался, обновляем статус
      if (errorMessage.includes('завершен') || errorMessage.includes('не начался')) {
        await fetchRoundFx(id);
      }
    } finally {
      setIsTapping(false);
    }
  };

  if (!currentRound) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Goose />

      {roundStatus === RoundStatus.COOLDOWN && (
        <>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Cooldown
          </Typography>
          <Timer
            startDate={currentRound.startDate}
            endDate={currentRound.endDate}
            status={roundStatus}
            onStatusChange={handleStatusChange}
          />
        </>
      )}

      {roundStatus === RoundStatus.ACTIVE && (
        <>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Раунд активен!
          </Typography>
          <Timer
            startDate={currentRound.startDate}
            endDate={currentRound.endDate}
            status={roundStatus}
            onStatusChange={handleStatusChange}
          />
          <Typography variant="h6" sx={{ mb: 3 }}>
            Мои очки - {myScore}
          </Typography>
          {tapError && (
            <Alert severity="error" sx={{ mb: 2, maxWidth: 400, mx: 'auto' }}>
              {tapError}
            </Alert>
          )}
          <Button
            variant="contained"
            size="large"
            onClick={handleTap}
            disabled={isTapping}
            sx={{ minWidth: 200 }}
          >
            {isTapping ? 'Тапаю...' : 'Тапнуть'}
          </Button>
        </>
      )}

      {roundStatus === RoundStatus.FINISHED && (
        <>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Раунд завершен
          </Typography>
          <Paper sx={{ p: 3, maxWidth: 400, mx: 'auto', textAlign: 'left' }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Всего: {currentRound.totalScore}
            </Typography>
            {currentRound.winner && (
              <Typography variant="body1" sx={{ mb: 1 }}>
                Победитель - {currentRound.winner.username}: {currentRound.winnerScore || 0}
              </Typography>
            )}
            <Typography variant="body1">
              Мои очки: {myScore}
            </Typography>
          </Paper>
          <Button
            variant="outlined"
            onClick={() => navigate('/rounds')}
            sx={{ mt: 3 }}
          >
            Вернуться к списку раундов
          </Button>
        </>
      )}
    </Box>
  );
}

