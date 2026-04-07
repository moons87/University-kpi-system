import { Box, Typography, Stack, Button, Card, CardContent } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import useFilterStore from '../store/filterStore';

export default function ReportsPage() {
  const { year, semester } = useFilterStore();

  const handleDownload = () => {
    alert(`Connect Power BI directly to PostgreSQL:\nHost: localhost:5432\nDatabase: university_analytics\nSelected period: ${year} Semester ${semester}`);
  };

  return (
    <Box>
      <Typography variant="h5" mb={3}>Reports & Exports</Typography>
      <Stack spacing={2}>
        <Card sx={{ maxWidth: 500 }}>
          <CardContent>
            <Typography variant="h6" mb={1}>Power BI Connection</Typography>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Connect Power BI directly to PostgreSQL:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
              Host: localhost:5432<br />
              Database: university_analytics<br />
              User: postgres
            </Typography>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownload}>
              Connection Info
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
