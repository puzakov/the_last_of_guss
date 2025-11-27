import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Round, RoundStatus } from '../../types';

interface RoundCardProps {
  round: Round;
}

export default function RoundCard({ round }: RoundCardProps) {
  const navigate = useNavigate();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusLabel = (status?: RoundStatus): string => {
    switch (status) {
      case RoundStatus.COOLDOWN:
        return 'Cooldown';
      case RoundStatus.ACTIVE:
        return 'Активен';
      case RoundStatus.FINISHED:
        return 'Завершен';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusColor = (status?: RoundStatus): 'default' | 'primary' | 'success' | 'error' => {
    switch (status) {
      case RoundStatus.COOLDOWN:
        return 'default';
      case RoundStatus.ACTIVE:
        return 'success';
      case RoundStatus.FINISHED:
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 4,
        },
      }}
      onClick={() => navigate(`/rounds/${round.id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="div">
            Round ID: {round.id}
          </Typography>
          <Chip
            label={getStatusLabel(round.status)}
            color={getStatusColor(round.status)}
            size="small"
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Start: {formatDate(round.startDate)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          End: {formatDate(round.endDate)}
        </Typography>
        <Box sx={{ borderTop: '1px solid #e0e0e0', pt: 1 }}>
          <Typography variant="body2">
            Статус: {getStatusLabel(round.status)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

