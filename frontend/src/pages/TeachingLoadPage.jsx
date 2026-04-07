import { useEffect, useState } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PeriodSelector from '../components/PeriodSelector';
import { getTeachingLoad } from '../api/teachingLoad';
import useFilterStore from '../store/filterStore';

export default function TeachingLoadPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const { timeId } = useFilterStore();

  useEffect(() => {
    const params = timeId ? { time_id: timeId } : {};
    getTeachingLoad(params).then(setRows).finally(() => setLoading(false));
  }, [timeId]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Teaching Load</Typography>
        <PeriodSelector />
      </Stack>
      <DataGrid
        rows={rows}
        columns={[
          { field: 'teacher_id', headerName: 'Teacher ID', width: 110 },
          { field: 'subject_id', headerName: 'Subject ID', width: 110 },
          { field: 'group_id',   headerName: 'Group ID',   width: 100 },
          { field: 'time_id',    headerName: 'Period ID',  width: 100 },
          { field: 'hours',      headerName: 'Hours',      width: 90 },
        ]}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />
    </Box>
  );
}
