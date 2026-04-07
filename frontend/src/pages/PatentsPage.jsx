import { useEffect, useState } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PeriodSelector from '../components/PeriodSelector';
import { getPatents } from '../api/patents';
import useFilterStore from '../store/filterStore';

export default function PatentsPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const { timeId } = useFilterStore();

  useEffect(() => {
    const params = timeId ? { time_id: timeId } : {};
    getPatents(params).then(setRows).finally(() => setLoading(false));
  }, [timeId]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Patents</Typography>
        <PeriodSelector />
      </Stack>
      <DataGrid
        rows={rows}
        columns={[
          { field: 'teacher_id',          headerName: 'Teacher',             width: 100 },
          { field: 'title',               headerName: 'Title',               flex: 2 },
          { field: 'registration_number', headerName: 'Registration Number', flex: 1 },
        ]}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />
    </Box>
  );
}
