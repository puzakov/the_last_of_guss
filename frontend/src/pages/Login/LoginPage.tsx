import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { loginFx } from '../../stores/auth.store';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError('');
    setLoginError('');

    // Валидация пароля на клиенте
    if (value.length > 0 && value.length < 8) {
      setPasswordError('Пароль должен быть не менее 8 символов');
      return;
    }

    if (value.length > 0 && !/^[a-zA-Z0-9]+$/.test(value)) {
      setPasswordError('Пароль должен содержать только буквы и цифры без спецсимволов');
      return;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // Финальная валидация
    if (password.length < 8) {
      setPasswordError('Пароль должен быть не менее 8 символов');
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(password)) {
      setPasswordError('Пароль должен содержать только буквы и цифры без спецсимволов');
      return;
    }

    if (!username.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await loginFx({ username: username.trim(), password });
      navigate('/rounds');
    } catch (error: any) {
      setLoginError(error.response?.data?.message || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" align="center" gutterBottom>
            ВОЙТИ
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              autoComplete="username"
            />
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              margin="normal"
              required
              error={!!passwordError}
              helperText={passwordError}
              autoComplete="current-password"
            />
            {loginError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {loginError}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading || !!passwordError || password.length < 8}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

