import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Box, Typography } from '@mui/material';
import { Home, Settings } from '@mui/icons-material';

const Sidebar = () => {
  const drawerWidth = 240;
  const headerHeight = 64; // Match this with the header height

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#211838',
          borderRight: 'none',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
        },
      }}
    >
      {/* Logo and App Name with White Background */}
      <Box 
        sx={{ 
          backgroundColor: 'white', 
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          height: `${headerHeight}px`,
          boxSizing: 'border-box',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
        }}
      >
        <Box
          component="img"
          src="/images/Logo-white.png"
          alt="Logo"
          sx={{
            height: 32,
            width: 32,
            objectFit: 'contain',
            filter: 'invert(1)' // Invert the logo to be visible on white
          }}
        />
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            color: 'rgba(0, 0, 0, 0.87)',
            fontSize: '1.25rem',
            fontWeight: 500,
            lineHeight: 1.6,
            letterSpacing: '0.0075em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          Report Manager
        </Typography>
      </Box>
      
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
      
      {/* Navigation Menu */}
      <List sx={{ 
        color: 'white', 
        flexGrow: 1,
        paddingTop: 0,
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
        },
      }}>
        <ListItem disablePadding>
          <ListItemButton sx={{ 
            color: 'white', 
            padding: '12px 16px',
            '&:hover': { 
              backgroundColor: 'rgba(255, 255, 255, 0.08)' 
            } 
          }}>
            <ListItemIcon sx={{ color: 'white', minWidth: '40px' }}>
              <Home />
            </ListItemIcon>
            <ListItemText 
              primary="Home" 
              primaryTypographyProps={{ 
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 400,
                lineHeight: 1.5,
                letterSpacing: '0.00938em'
              }} 
            />
          </ListItemButton>
        </ListItem>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
        <ListItem disablePadding>
          <ListItemButton sx={{ 
            color: 'white',
            padding: '12px 16px',
            '&:hover': { 
              backgroundColor: 'rgba(255, 255, 255, 0.08)' 
            } 
          }}>
            <ListItemIcon sx={{ color: 'white', minWidth: '40px' }}>
              <Settings />
            </ListItemIcon>
            <ListItemText 
              primary="Settings" 
              primaryTypographyProps={{ 
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 400,
                lineHeight: 1.5,
                letterSpacing: '0.00938em'
              }} 
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
