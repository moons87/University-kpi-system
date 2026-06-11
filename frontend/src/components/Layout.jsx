import { Box, AppBar, Toolbar, Typography, Button, Stack } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import Sidebar from './Sidebar';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { logout as apiLogout } from '../api/auth';

const DRAWER_WIDTH  = 240;
const APPBAR_HEIGHT = 56;

export default function Layout({ children }) {
  const logout   = useAuthStore((s) => s.logout);
  const user     = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiLogout();  // Ask backend to clear the httpOnly cookie
    } catch {
      // If the request fails (e.g. already expired), still clear local state
    }
    logout();
    navigate('/login');
  };

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'UA';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6fb' }}>
      {/* ── Top bar ── */}
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1, height: APPBAR_HEIGHT }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: `${APPBAR_HEIGHT}px !important`, px: 3 }}>
          {/* Logo */}
          <Typography
            sx={{
              fontFamily: '"Cormorant Garamond", serif',
              fontWeight: 700,
              fontSize: '1.2rem',
              letterSpacing: '0.03em',
              color: '#1a2540',
              userSelect: 'none',
            }}
          >
            University
            <Box component="span" sx={{ color: '#b07d2a', ml: 0.75 }}>Analytics</Box>
          </Typography>

          {/* Right side */}
          <Stack direction="row" alignItems="center" spacing={2}>
            {user && (
              <Stack direction="row" alignItems="center" spacing={1.5}>
                {/* Avatar */}
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    bgcolor: 'rgba(176,125,42,0.1)',
                    border: '1.5px solid rgba(176,125,42,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    letterSpacing: '0.05em',
                    color: '#b07d2a',
                  }}
                >
                  {initials}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.78rem', color: '#1a2540', lineHeight: 1.2, fontWeight: 500 }}>
                    {user.email}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.63rem',
                      color: user.role === 'admin' ? '#b07d2a' : '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      lineHeight: 1,
                    }}
                  >
                    {user.role}
                  </Typography>
                </Box>
              </Stack>
            )}

            <Button
              size="small"
              onClick={handleLogout}
              startIcon={<LogoutIcon sx={{ fontSize: '0.9rem !important' }} />}
              sx={{
                color: '#94a3b8',
                fontSize: '0.78rem',
                fontWeight: 400,
                textTransform: 'none',
                border: '1px solid #e2e8f2',
                px: 1.5,
                py: 0.5,
                borderRadius: '6px',
                '&:hover': { color: '#1a2540', borderColor: '#b0bccc', bgcolor: '#f4f6fb' },
              }}
            >
              Шығу
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* ── Sidebar ── */}
      <Sidebar drawerWidth={DRAWER_WIDTH} appBarHeight={APPBAR_HEIGHT} />

      {/* ── Main content ── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${DRAWER_WIDTH}px`,
          mt: `${APPBAR_HEIGHT}px`,
          p: 3,
          minHeight: `calc(100vh - ${APPBAR_HEIGHT}px)`,
          bgcolor: '#f4f6fb',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
