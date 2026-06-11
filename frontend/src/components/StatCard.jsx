import { Box, Typography } from '@mui/material';

const ACCENT_MAP = {
  'primary.main':  '#b07d2a',
  'success.main':  '#16a34a',
  'warning.main':  '#d97706',
  'error.main':    '#dc2626',
  'info.main':     '#2563eb',
};

export default function StatCard({ label, value, color = 'primary.main', delay = 0 }) {
  const accentColor = ACCENT_MAP[color] || ACCENT_MAP['primary.main'];

  return (
    <Box
      className="fade-up"
      sx={{
        animationDelay: `${delay}ms`,
        opacity: 0,
        minWidth: 170,
        borderRadius: '10px',
        border: '1px solid #e2e8f2',
        bgcolor: '#ffffff',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          boxShadow: `0 4px 18px rgba(0,0,0,0.1)`,
          borderColor: `${accentColor}50`,
        },
      }}
    >
      {/* Top accent line */}
      <Box sx={{ height: '3px', bgcolor: accentColor }} />

      <Box sx={{ px: 2.5, pt: 2, pb: 2.5 }}>
        <Typography
          sx={{
            fontSize: '0.67rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#94a3b8',
            fontFamily: '"Outfit", sans-serif',
            mb: 1,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '2rem',
            fontWeight: 600,
            color: accentColor,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
