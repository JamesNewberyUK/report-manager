import { Box, CssBaseline, Toolbar, CircularProgress } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null; // Will be redirected by the useEffect
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: 'calc(100% - 240px)' },
          overflow: 'auto',
          height: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Toolbar /> {/* This Toolbar is for spacing below the AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
}

export default App;
