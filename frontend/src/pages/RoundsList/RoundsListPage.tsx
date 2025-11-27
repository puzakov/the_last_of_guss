import { useEffect } from 'react';
import { useUnit } from 'effector-react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { $rounds, fetchRoundsFx, createRoundFx } from '../../stores/rounds.store';
import { $user } from '../../stores/auth.store';
import { UserRole } from '../../types';
import RoundCard from '../../components/RoundCard/RoundCard';

export default function RoundsListPage() {
  const rounds = useUnit($rounds);
  const user = useUnit($user);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoundsFx();
  }, []);

  const handleCreateRound = async () => {
    try {
      const newRound = await createRoundFx();
      navigate(`/rounds/${newRound.id}`);
    } catch (error) {
      console.error('Error creating round:', error);
    }
  };

  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Список РАУНДОВ
        </Typography>
      </Box>
      {isAdmin && (
        <Button
          variant="contained"
          onClick={handleCreateRound}
          sx={{ mb: 3 }}
        >
          Создать раунд
        </Button>
      )}
      {rounds.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          Раунды не найдены
        </Typography>
      ) : (
        rounds.map((round) => <RoundCard key={round.id} round={round} />)
      )}
    </Box>
  );
}

