import { ReactNode } from 'react';
import { useUnit } from 'effector-react';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';
import { $user, logoutFx } from '../../stores/auth.store';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const user = useUnit($user);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutFx();
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            The Last of Guss
          </Typography>
          {user && (
            <>
              <Typography variant="body1" sx={{ mr: 2 }}>
                {user.username}
              </Typography>
              <Typography
                variant="body2"
                onClick={handleLogout}
                sx={{ cursor: 'pointer', textDecoration: 'underline' }}
              >
                Выйти
              </Typography>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {children}
      </Container>
    </Box>
  );
}

