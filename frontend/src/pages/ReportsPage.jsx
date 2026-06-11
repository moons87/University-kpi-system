import { Box, Typography, Stack, Button, Card, CardContent } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import useFilterStore from '../store/filterStore';
import useAuthStore from '../store/authStore';

export default function ReportsPage() {
  const { year, semester } = useFilterStore();
  const user = useAuthStore((s) => s.user);

  if (user?.role !== 'admin') {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">Қол жетімділік жоқ</Typography>
        <Typography variant="body1">Тек әкімшілер есептерді қарай алады.</Typography>
      </Box>
    );
  }

  const handleDownload = () => {
    alert(`Power BI-ды PostgreSQL-ге тікелей қосыңыз:\nХост: localhost:5432\nДеректер қоры: university_analytics\nТаңдалған кезең: ${year} Семестр ${semester}`);
  };

  return (
    <Box>
      <Typography variant="h5" mb={3}>Есептер мен экспорт</Typography>
      <Stack spacing={2}>
        <Card sx={{ maxWidth: 500 }}>
          <CardContent>
            <Typography variant="h6" mb={1}>Power BI қосылымы</Typography>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Power BI-ды PostgreSQL-ге тікелей қосыңыз:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
              Хост: localhost:5432<br />
              Деректер қоры: university_analytics<br />
              Пайдаланушы: postgres
            </Typography>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownload}>
              Қосылым ақпараты
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
