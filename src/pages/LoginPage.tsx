import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Button, TextField, Typography, Container, Paper, Link, Alert } from '@mui/material';
import { supabase } from '../lib/supabase';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendStatus, setResendStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            throw new Error('This email is already registered. Please sign in instead.');
          }
          throw signUpError;
        }
        // On successful signup, show success message and switch to login
        setError('Sign up successful! Please check your email to confirm your account.');
        setIsSignUp(false);
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          // Check if the error is due to unconfirmed email
          if (signInError.message.includes('Email not confirmed')) {
            setShowResendConfirmation(true);
          }
          throw signInError;
        }

        // If we get here, the user is signed in and email is confirmed
        navigate('/');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(
        err.message || 'Failed to authenticate. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', mt: 4 }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            {isSignUp ? 'Create an Account' : 'Sign In'}
          </Typography>
          
          {error && (
            <Box color="error.main" mb={2} textAlign="center">
              {error}
            </Box>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            {showResendConfirmation && (
              <Box mt={2} textAlign="center">
                <Alert severity="info" sx={{ mb: 2 }}>
                  Your email needs to be confirmed before signing in.
                </Alert>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.resend({
                        type: 'signup',
                        email: email,
                      });
                      if (error) throw error;
                      setResendStatus({
                        type: 'success',
                        message: 'Confirmation email resent successfully! Please check your inbox.'
                      });
                    } catch (err: any) {
                      setResendStatus({
                        type: 'error',
                        message: err.message || 'Failed to resend confirmation email.'
                      });
                    }
                  }}
                >
                  Resend Confirmation Email
                </Button>
                {resendStatus && (
                  <Alert severity={resendStatus.type} sx={{ mt: 1 }}>
                    {resendStatus.message}
                  </Alert>
                )}
              </Box>
            )}

            <Box textAlign="center" mt={2}>
              <Link 
                href="#" 
                variant="body2" 
                onClick={(e) => {
                  e.preventDefault();
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
