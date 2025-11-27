import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUnit } from 'effector-react';
import { $isAuthenticated, checkAuthFx } from './stores/auth.store';
import LoginPage from './pages/Login/LoginPage';
import RoundsListPage from './pages/RoundsList/RoundsListPage';
import RoundPage from './pages/Round/RoundPage';
import Layout from './components/Layout/Layout';

function App() {
  const isAuthenticated = useUnit($isAuthenticated);

  useEffect(() => {
    // Проверяем и восстанавливаем пользователя из токена при загрузке
    checkAuthFx();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/rounds" replace /> : <LoginPage />}
        />
        <Route
          path="/rounds"
          element={
            isAuthenticated ? (
              <Layout>
                <RoundsListPage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/rounds/:id"
          element={
            isAuthenticated ? (
              <Layout>
                <RoundPage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/" element={<Navigate to="/rounds" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

