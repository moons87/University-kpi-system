import { Card, CardContent, Typography } from '@mui/material';

export default function StatCard({ label, value, color = 'primary.main' }) {
  return (
    <Card sx={{ minWidth: 160 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h4" color={color} sx={{ mt: 1 }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}
