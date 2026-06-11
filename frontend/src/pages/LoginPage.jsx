import { useState } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { login, getMe } from '../api/auth';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const setUser  = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Backend sets an httpOnly cookie — no token handling in JS
      await login(email, password);
      // Fetch user info to populate the store
      const userData = await getMe();
      setUser(userData);
      navigate('/');
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Тым көп кіру әрекеті. 1 минут күтіңіз.');
      } else {
        setError('Қате email немесе құпия сөз');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: '#f4f6fb',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background pattern */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(176,125,42,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(176,125,42,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }}
      />

      {/* Ambient glow */}
      <Box sx={{ position: 'absolute', top: '10%', left: '5%', width: 500, height: 500, borderRadius: '50%', bgcolor: 'rgba(176,125,42,0.05)', filter: 'blur(90px)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '5%', right: '5%', width: 400, height: 400, borderRadius: '50%', bgcolor: 'rgba(59,130,246,0.05)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* Left branding panel */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          px: 8,
          borderRight: '1px solid #e2e8f2',
          position: 'relative',
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
            fontWeight: 700,
            color: '#1a2540',
            lineHeight: 1.1,
            mb: 2,
          }}
        >
          University
          <br />
          <Box component="span" sx={{ color: '#b07d2a' }}>Analytics</Box>
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Outfit", sans-serif',
            fontSize: '0.95rem',
            color: '#94a3b8',
            maxWidth: 380,
            lineHeight: 1.75,
            mt: 1,
          }}
        >
          Кафедраның KPI аналитика платформасы. Оқытушылардың көрсеткіштерін,
          жарияланымдарды, жобалар мен жетістіктерді бір кеңістікте бақылаңыз.
        </Typography>

        <Box sx={{ mt: 5, display: 'flex', gap: 4 }}>
          {[
            { n: 'KPI',  d: 'метрик' },
            { n: 'Real', d: 'time' },
            { n: 'ETL',  d: 'pipeline' },
          ].map(({ n, d }) => (
            <Box key={n}>
              <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1rem', fontWeight: 600, color: '#b07d2a' }}>{n}</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#c8d0e0', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{d}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right form panel */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: { xs: 1, md: '0 0 440px' },
          px: { xs: 3, md: 6 },
        }}
      >
        <Box className="fade-up" sx={{ width: '100%', maxWidth: 360 }}>
          {/* Mobile logo */}
          <Typography
            sx={{
              display: { md: 'none' },
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '1.8rem',
              fontWeight: 700,
              color: '#1a2540',
              mb: 3,
            }}
          >
            University <Box component="span" sx={{ color: '#b07d2a' }}>Analytics</Box>
          </Typography>

          <Typography sx={{ fontFamily: '"Outfit", sans-serif', fontSize: '1.05rem', fontWeight: 600, color: '#1a2540', mb: 0.5 }}>
            Жүйеге кіру
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', mb: 3.5 }}>
            Корпоративтік email мен құпия сөзді енгізіңіз
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, fontSize: '0.82rem' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Электрондық пошта" type="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required size="small" sx={{ mb: 2 }}
              slotProps={{
                inputLabel: { sx: { fontSize: '0.85rem' } },
                htmlInput:  { style: { fontFamily: '"Outfit", sans-serif', fontSize: '0.9rem' } },
              }}
            />
            <TextField
              fullWidth label="Құпия сөз" type="password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required size="small" sx={{ mb: 3 }}
              slotProps={{
                inputLabel: { sx: { fontSize: '0.85rem' } },
                htmlInput:  { style: { fontFamily: '"Outfit", sans-serif', fontSize: '0.9rem' } },
              }}
            />
            <Button fullWidth variant="contained" type="submit" disabled={loading} sx={{ py: 1.2, fontSize: '0.88rem' }}>
              {loading ? 'Кіру...' : 'Кіру'}
            </Button>
          </form>

          <Typography sx={{ mt: 3, fontSize: '0.7rem', color: '#d0d8e8', textAlign: 'center', fontFamily: '"JetBrains Mono", monospace' }}>
            © {new Date().getFullYear()} University Analytics Platform
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
