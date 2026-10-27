import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Box, CircularProgress, Typography, Button, Container } from '@mui/material';
import Head from 'next/head';

const HomePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // If user is logged in, redirect to reports page
        router.push('/reports');
      } else {
        // If not logged in, redirect to login page
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
      >
        <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
        <Typography variant="h6" color="textSecondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // This is a fallback in case the redirect doesn't work
  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
      <Head>
        <title>Report Manager</title>
        <meta name="description" content="Manage your reports and components" />
      </Head>
      
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome to Report Manager
      </Typography>
      
      <Typography variant="h6" color="textSecondary" paragraph sx={{ mb: 4 }}>
        {user ? 'Redirecting to your reports...' : 'Please sign in to continue'}
      </Typography>
      
      {!user && (
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={() => router.push('/login')}
        >
          Go to Login
        </Button>
      )}
    </Container>
  );
};

export default HomePage;
