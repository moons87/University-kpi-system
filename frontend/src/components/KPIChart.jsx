import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Typography } from '@mui/material';

export default function KPIChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180 }}>
        <Typography sx={{ color: '#c8d0e0', fontSize: '0.85rem', fontFamily: '"Outfit", sans-serif' }}>
          Нет данных для выбранного периода
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 320 }}>
      <BarChart
        dataset={data.map((d) => ({ name: d.teacher_name, score: Number(d.total_score) || 0 }))}
        xAxis={[{
          scaleType: 'band',
          dataKey: 'name',
          tickLabelStyle: { fontFamily: '"Outfit", sans-serif', fontSize: 11, fill: '#94a3b8' },
        }]}
        yAxis={[{
          tickLabelStyle: { fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fill: '#b0bcd0' },
        }]}
        series={[{ dataKey: 'score', label: 'KPI Score', color: '#b07d2a' }]}
        height={320}
        sx={{
          '& .MuiChartsAxis-line': { stroke: '#e2e8f2' },
          '& .MuiChartsAxis-tick': { stroke: '#e2e8f2' },
        }}
        slotProps={{
          legend: {
            labelStyle: { fontFamily: '"Outfit", sans-serif', fontSize: 12, fill: '#94a3b8' },
          },
        }}
      />
    </Box>
  );
}
