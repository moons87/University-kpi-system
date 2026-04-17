import { Alert, Box, Typography } from '@mui/material';

export default function ImportSummary({ result }) {
  if (!result) return null;
  return (
    <Box mt={2}>
      <Alert severity={result.skipped > 0 ? 'warning' : 'success'}>
        <Typography variant="body2">
          Импортировано: <strong>{result.imported}</strong> записей.
          Пропущено: <strong>{result.skipped}</strong>.
        </Typography>
        {result.details.length > 0 && (
          <Box mt={1} component="ul" sx={{ pl: 2, m: 0 }}>
            {result.details.map((d, i) => (
              <li key={i}><Typography variant="body2">{d}</Typography></li>
            ))}
          </Box>
        )}
      </Alert>
    </Box>
  );
}
