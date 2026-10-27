import { AppBar, Typography, Button, Box } from '@mui/material';

const Header = () => {
  const handleSignOut = () => {
    // TODO: Implement actual sign out logic
    console.log('Sign out clicked');
    // For now, just reload the page
    window.location.href = '/';
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: 'calc(100% - 240px)' },
        left: { sm: '240px' },
        right: 0,
        backgroundColor: 'white',
        color: 'black',
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
        height: '64px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 24px',
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px',
        height: '100%'
      }}>
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'rgba(0, 0, 0, 0.87)',
            fontSize: '0.875rem',
            lineHeight: '1.43',
          }}
        >
          james.newbery@hotmail.co.uk
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleSignOut}
          sx={{ 
            textTransform: 'none',
            boxShadow: 'none',
            padding: '6px 16px',
            fontSize: '0.875rem',
            fontWeight: 500,
            lineHeight: 1.75,
            borderRadius: '4px',
            '&:hover': {
              boxShadow: 'none',
            }
          }}
        >
          Sign Out
        </Button>
      </Box>
    </AppBar>
  );
};

export default Header;
